import { useEffect, useState, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { Gavel, Megaphone, Shield, Volume2, VolumeX } from 'lucide-react';
import PlayerPhoto from '../components/PlayerPhoto';
import { useAuctionSounds } from '../hooks/useAuctionSounds';

const TeamLogo = ({ teamId, size }: { teamId: string | null, size: number }) => {
  if (!teamId) return <Shield size={size} color="var(--text-dim)" />;
  let src = '';
  if (teamId === 'Crystal Palace') src = '/photo/team-logo/crystal palace.jpg';
  else if (teamId === 'Dortmund') src = '/photo/team-logo/Dortmund.png';
  else if (teamId === 'Newcastle') src = '/photo/team-logo/Newcastle.png';
  else if (teamId === 'Leverkusen') src = '/photo/team-logo/Leverkusen.png';
  
  if (src) {
    return <img src={src} alt={teamId} style={{ width: size, height: size, objectFit: 'contain', borderRadius: '50%' }} />;
  }
  return <Shield size={size} color="var(--text-dim)" />;
};

export default function Dashboard() {
  const [players, setPlayers] = useState<any>({});
  const [auctionState, setAuctionState] = useState<any>({ activePlayerId: null, currentPrice: 0, lastBidTeam: null, isPublished: false });
  const [teams, setTeams] = useState<any>({});
  const [lastSoldPlayer, setLastSoldPlayer] = useState<any>(null);
  
  const { isMuted, audioStarted, toggleMute, startAudio, playBid, playSold, playNewPlayer } = useAuctionSounds();

  // Refs for change detection
  const prevPrice = useRef(0);
  const prevActivePlayerId = useRef<string | null>(null);
  const prevSoldStatus = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const playersRef = ref(db, 'players');
    onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Detect Sold events
        Object.values(data).forEach((p: any) => {
          if (p.isSold && !prevSoldStatus.current[p.id]) {
            playSold();
            setLastSoldPlayer(p);
          }
          prevSoldStatus.current[p.id] = p.isSold;
        });
        setPlayers(data);
      }
    });

    const auctionRef = ref(db, 'auctionState');
    onValue(auctionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Detect Bid events
        if (data.currentPrice > prevPrice.current) {
          playBid();
        }
        prevPrice.current = data.currentPrice;

        // Detect New Player events
        if (data.activePlayerId && data.activePlayerId !== prevActivePlayerId.current) {
          playNewPlayer();
          setLastSoldPlayer(null); // Clear last sold when new bidding starts
        }
        prevActivePlayerId.current = data.activePlayerId;

        setAuctionState(data);
      }
    });

    const teamsRef = ref(db, 'teams');
    onValue(teamsRef, (snapshot) => {
      if (snapshot.val()) setTeams(snapshot.val());
    });
  }, [playBid, playSold, playNewPlayer]);

  const activePlayer = auctionState.activePlayerId ? players[auctionState.activePlayerId] : null;

  // Calculate Stats
  const playersList = Object.values(players);
  const totalPlayers = playersList.length;
  const playersSold = playersList.filter((p: any) => p.isSold).length;
  const totalSpent = playersList.filter((p: any) => p.isSold).reduce((acc: number, p: any) => acc + (p.price || 0), 0);
  const totalTeams = Object.keys(teams).length;

  if (auctionState.isPublished) {
    return (
      <div className="dashboard-root">
        <div className="published-container">
          <h1 style={{ fontFamily: 'Teko', fontSize: '5rem', color: 'var(--neon-pink)', textTransform: 'uppercase' }}>Final Auction Results</h1>
          <div className="final-teams-grid">
            {Object.values(teams).map((team: any) => {
              const teamPlayers = playersList.filter((p: any) => p.soldTo === team.id);
              return (
                <div key={team.id} className="final-team-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                    <TeamLogo teamId={team.id} size={32} />
                    <div>
                      <h2 style={{ fontFamily: 'Teko', fontSize: '2.5rem', lineHeight: 1 }}>{team.name}</h2>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>C: {team.captain} | AC: {team.asstCaptain}</div>
                    </div>
                  </div>
                  <ul className="roster-list">
                    {teamPlayers.map((p: any) => (
                      <li key={p.id} className="roster-item">
                        <span>{p.name}</span>
                        <span style={{ color: 'var(--price-yellow)' }}>₹{p.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Active Bidder styling logic
  const getTeamColor = (teamId: string) => {
    switch(teamId) {
      case 'Crystal Palace': return 'var(--team-cpa)';
      case 'Dortmund': return 'var(--team-dor)';
      case 'Newcastle': return 'var(--team-new)';
      case 'Leverkusen': return 'var(--team-lev)';
      default: return 'var(--text-primary)';
    }
  };

  return (
    <div className="dashboard-root">
      {/* Audio Control Overlay */}
      {!audioStarted && (
        <div className="audio-overlay" onClick={startAudio}>
          <div className="audio-prompt">
            <Volume2 size={48} color="var(--neon-pink)" />
            <h2>CLICK TO ENABLE SOUND</h2>
            <p>Experience the auction with immersive sound effects</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ position: 'absolute', top: '20px', right: '40px', zIndex: 100 }}>
        <button className={`audio-toggle ${isMuted ? 'muted' : ''}`} onClick={toggleMute}>
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          <span>{isMuted ? 'SOUND OFF' : 'SOUND ON'}</span>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="dash-content">
        
        {/* Left Column */}
        <div className="left-col">
          {activePlayer ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', fontSize: '1.2rem', letterSpacing: '4px', fontWeight: 800 }}>
                <div style={{ width: '4px', height: '20px', background: 'var(--neon-pink)' }}></div> LIVE AUCTION
              </div>
              
              <div style={{ margin: '20px 0' }}>
                <div className="player-title">{activePlayer.name}</div>
                <div className="player-role" style={{ fontSize: '1rem' }}>PLAYER IN FOCUS</div>
              </div>

              <div className="price-card">
                <div className="card-label">CURRENT PRICE</div>
                <div className="price-value">₹ {auctionState.currentPrice.toLocaleString()}</div>
              </div>

              <div className="bid-card">
                <div className="card-label">LAST BID BY</div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                  <TeamLogo teamId={auctionState.lastBidTeam} size={40} />
                  <div className="bid-team-name" style={{ color: auctionState.lastBidTeam ? getTeamColor(auctionState.lastBidTeam) : 'var(--text-dim)' }}>
                    {auctionState.lastBidTeam ? teams[auctionState.lastBidTeam]?.name : 'WAITING...'}
                  </div>
                </div>
              </div>

              <div className="status-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                <div style={{ background: 'rgba(255, 20, 147, 0.2)', padding: '15px', borderRadius: '50%' }}>
                  <Gavel size={24} color="var(--neon-pink)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '1px' }}>AUCTION IN PROGRESS</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>The battle for the best<br/>continues...</div>
                </div>
              </div>

              <div className="ticker-wrap">
                <Megaphone size={20} color="var(--neon-pink)" />
                <div>Stay tuned! The battle for the best players has just begun.</div>
              </div>
            </>
          ) : lastSoldPlayer ? (
            <>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neon-pink)', fontSize: '1.2rem', letterSpacing: '4px', fontWeight: 800 }}>
                <div style={{ width: '4px', height: '20px', background: 'var(--neon-pink)' }}></div> PLAYER SOLD
              </div>
              
              <div style={{ margin: '20px 0' }}>
                <div className="player-title" style={{ color: 'var(--price-yellow)' }}>{lastSoldPlayer.name}</div>
                <div className="player-role" style={{ fontSize: '1rem', color: 'white' }}>SELECTED TO {teams[lastSoldPlayer.soldTo]?.name}</div>
              </div>

              <div className="price-card" style={{ borderLeft: '4px solid var(--price-yellow)' }}>
                <div className="card-label">SOLD PRICE</div>
                <div className="price-value" style={{ color: 'white' }}>₹ {lastSoldPlayer.price.toLocaleString()}</div>
              </div>

              <div className="bid-card" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: '#10b981' }}>
                <div className="card-label">TEAM</div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                  <TeamLogo teamId={lastSoldPlayer.soldTo} size={40} />
                  <div className="bid-team-name" style={{ color: getTeamColor(lastSoldPlayer.soldTo) }}>
                    {teams[lastSoldPlayer.soldTo]?.name}
                  </div>
                </div>
              </div>
            </>
          ) : (
             <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', alignItems: 'center', color: 'var(--text-dim)' }}>
               <Gavel size={64} style={{ marginBottom: '20px', opacity: 0.5 }} />
               <h2 style={{ fontFamily: 'Teko', fontSize: '3rem' }}>WAITING FOR PLAYER</h2>
             </div>
          )}
        </div>

        {/* Center Column */}
        <div className="center-col">
           {activePlayer ? (
             <>
               <div className="player-bg-number">24</div>
               <PlayerPhoto name={activePlayer.name} className="player-main-image" />
             </>
           ) : lastSoldPlayer ? (
            <>
               <div className="player-bg-number" style={{ color: 'rgba(16, 185, 129, 0.05)' }}>SOLD</div>
               <div className="sold-stamp" style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%) rotate(-15deg)', border: '8px solid #ef4444', color: '#ef4444', padding: '10px 40px', fontSize: '4rem', fontFamily: 'Teko', fontWeight: 900, zIndex: 20, borderRadius: '20px', textTransform: 'uppercase', opacity: 0.8 }}>SOLD</div>
               <PlayerPhoto name={lastSoldPlayer.name} className="player-main-image" style={{ filter: 'grayscale(0.5) brightness(0.7)' }} />
             </>
           ) : null}
        </div>

        {/* Right Column */}
        <div className="right-col">
          <div className="stats-card">
            <h3 className="teams-list-header" style={{ marginBottom: 0 }}>AUCTION STATS</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <h4>PLAYERS SOLD</h4>
                <div className="stat-val">{playersSold.toString().padStart(2, '0')}</div>
              </div>
              <div className="stat-item">
                <h4>TOTAL PLAYERS</h4>
                <div className="stat-val">{totalPlayers}</div>
              </div>
              <div className="stat-item">
                <h4>TEAMS</h4>
                <div className="stat-val">0{totalTeams}</div>
              </div>
              <div className="stat-item">
                <h4>TOTAL SPENT</h4>
                <div className="stat-val" style={{ fontSize: '1.6rem' }}>₹{totalSpent > 1000 ? (totalSpent/1000).toFixed(1) + 'k' : totalSpent}</div>
              </div>
            </div>
          </div>

          <h3 className="teams-list-header" style={{ marginTop: '10px' }}>TEAMS & LEADERS</h3>
          <div className="teams-stack">
            {Object.values(teams).map((team: any) => {
              const teamPlayers = playersList.filter((p: any) => p.soldTo === team.id);
              const count = teamPlayers.length;
              const spent = teamPlayers.reduce((acc: number, p: any) => acc + (p.price || 0), 0);
              const balance = 5000 - spent;
              const isActive = auctionState.lastBidTeam === team.id;
              
              return (
                <div key={team.id} className={`team-list-card ${isActive ? 'active-bidder' : ''}`}>
                  <div className="team-list-logo">
                    <TeamLogo teamId={team.id} size={24} />
                  </div>
                  <div className="team-list-info">
                    <div className="team-list-name" style={{ color: isActive ? 'var(--neon-pink)' : 'var(--text-primary)' }}>{team.name}</div>
                    <div className="team-list-caps">
                      CAPTAIN: <span style={{ color: 'var(--text-primary)' }}>{team.captain}</span> | ASST: <span style={{ color: 'var(--text-primary)' }}>{team.asstCaptain}</span><br />
                      <span style={{ color: 'var(--price-yellow)', fontSize: '1rem', fontWeight: 800 }}>BALANCE: ₹{balance}</span>
                    </div>
                  </div>
                  <div className="team-list-count">
                    <div className="count-val">{count.toString().padStart(2, '0')}</div>
                    <div className="count-label">PLAYERS</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto', textAlign: 'right', color: 'var(--neon-pink)', letterSpacing: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
            /// THIS AUCTION IS LIVE ///
          </div>
        </div>

      </div>
    </div>
  );
}
