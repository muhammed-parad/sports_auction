import { useEffect, useState } from 'react';
import { ref, onValue, set, update, remove } from 'firebase/database';
import { db } from '../firebase';
import * as XLSX from 'xlsx';
import { Download, Play, CheckCircle, RefreshCw, Edit2, Save, Volume2, VolumeX, Trash2 } from 'lucide-react';
import PlayerPhoto from '../components/PlayerPhoto';
import { useAuctionSounds } from '../hooks/useAuctionSounds';

const INITIAL_PLAYERS = [
  'Shammas', 'Shahid om', 'Asnaf', 'Arafath', 'Munawir', 'Thansif', 'Ameen thangal', 
  'Saad', 'Shabeer', 'Muhammed p', 'Fayiz', 'Thanseer', 'Sahal', 'Basith', 'Rizwan', 
  'Adil pk', 'Zayid', 'Farhan', 'Mazin', 'Nabhan', 'Jaseem', 'Razi ashraf', 'Irshad', 
  'Ramees', 'Munawwir', 'Nasrullah', 'Afhah', 'Munzir', 'Misab', 'Sinan cp', 'Midlaj', 'Muhammed G'
];

const TEAMS = [
  { id: 'Crystal Palace', name: 'Crystal Palace', captain: 'Mansoor', asstCaptain: 'Zayid' },
  { id: 'Dortmund', name: 'Dortmund', captain: 'Sinan Al Ameen', asstCaptain: 'Razi Ashraf' },
  { id: 'Newcastle', name: 'Newcastle', captain: 'Shahid', asstCaptain: 'Sahal' },
  { id: 'Leverkusen', name: 'Leverkusen', captain: 'Misab', asstCaptain: 'Mazin' }
];

export default function Admin() {
  const [players, setPlayers] = useState<any>({});
  const [auctionState, setAuctionState] = useState<any>({ activePlayerId: null, currentPrice: 0, lastBidTeam: null, isPublished: false });
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [customPrice, setCustomPrice] = useState(0);
  const [newPlayerName, setNewPlayerName] = useState('');

  const { isMuted, toggleMute, playBid, playSold, playNewPlayer, audioStarted, startAudio } = useAuctionSounds();

  useEffect(() => {
    const playersRef = ref(db, 'players');
    onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlayers(data);
      } else {
        // Seed initial data
        const initialData: any = {};
        INITIAL_PLAYERS.forEach((name, i) => {
          const id = `p${i}`;
          initialData[id] = {
            id,
            name,
            photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`,
            isSold: false,
            soldTo: null,
            price: 0
          };
        });
        set(ref(db, 'players'), initialData);
      }
    });

    const auctionRef = ref(db, 'auctionState');
    onValue(auctionRef, (snapshot) => {
      if (snapshot.val()) {
        setAuctionState(snapshot.val());
      } else {
        set(ref(db, 'auctionState'), { activePlayerId: null, currentPrice: 0, lastBidTeam: null, isPublished: false });
      }
    });

    const teamsRef = ref(db, 'teams');
    onValue(teamsRef, (snapshot) => {
      if (!snapshot.val()) {
        const tData: any = {};
        TEAMS.forEach(t => tData[t.id] = t);
        set(ref(db, 'teams'), tData);
      }
    });
  }, []);

  const selectPlayerForBidding = (id: string) => {
    playNewPlayer();
    update(ref(db, 'auctionState'), {
      activePlayerId: id,
      currentPrice: 0,
      lastBidTeam: null
    });
  };

  const updatePrice = (amount: number) => {
    if (amount > 0) playBid();
    update(ref(db, 'auctionState'), {
      currentPrice: Math.max(0, auctionState.currentPrice + amount)
    });
  };

  const setBidTeam = (teamId: string) => {
    playBid();
    update(ref(db, 'auctionState'), {
      lastBidTeam: teamId
    });
  };

  const markSoldOut = () => {
    if (auctionState.activePlayerId && auctionState.lastBidTeam) {
      playSold();
      update(ref(db, `players/${auctionState.activePlayerId}`), {
        isSold: true,
        soldTo: auctionState.lastBidTeam,
        price: auctionState.currentPrice
      });
      update(ref(db, 'auctionState'), {
        activePlayerId: null,
        currentPrice: 0,
        lastBidTeam: null
      });
    } else {
      alert("Please ensure a team is selected before marking sold out!");
    }
  };

  const togglePublish = () => {
    update(ref(db, 'auctionState'), {
      isPublished: !auctionState.isPublished
    });
  };

  const savePlayerEdit = (id: string) => {
    update(ref(db, `players/${id}`), {
      name: editName,
      photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(editName)}&background=random&size=200`
    });
    setEditingPlayerId(null);
  };

  const deletePlayer = (id: string) => {
    if (window.confirm("Are you sure you want to remove this player?")) {
      remove(ref(db, `players/${id}`));
    }
  };

  const resetAuction = () => {
    if (window.confirm("Are you sure you want to reset the entire auction? This will clear all sold players!")) {
      const resetPlayers: any = {};
      Object.values(players).forEach((p: any) => {
        resetPlayers[p.id] = { ...p, isSold: false, soldTo: null, price: 0 };
      });
      set(ref(db, 'players'), resetPlayers);
      set(ref(db, 'auctionState'), { activePlayerId: null, currentPrice: 0, lastBidTeam: null, isPublished: false });
    }
  };

  const clearCurrentBid = () => {
    update(ref(db, 'auctionState'), {
      activePlayerId: null,
      currentPrice: 0,
      lastBidTeam: null
    });
  };

  const addNewPlayer = () => {
    if (!newPlayerName.trim()) return;
    const id = `p_manual_${Date.now()}`;
    set(ref(db, `players/${id}`), {
      id,
      name: newPlayerName.trim(),
      photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(newPlayerName.trim())}&background=random&size=200`,
      isSold: false,
      soldTo: null,
      price: 0
    });
    setNewPlayerName('');
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const data = [["Team", "Role", "Name", "Price"]];
    
    TEAMS.forEach(t => {
      data.push([t.name, "Captain", t.captain, "-"]);
      data.push([t.name, "Asst Captain", t.asstCaptain, "-"]);
      
      Object.values(players).forEach((p: any) => {
        if (p.soldTo === t.id) {
          data.push([t.name, "Player", p.name, p.price.toString()]);
        }
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Teams");
    XLSX.writeFile(wb, "Auction_Results.xlsx");
  };

  const activePlayer = auctionState.activePlayerId ? players[auctionState.activePlayerId] : null;

  return (
    <div className="admin-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="text-gradient">Control Panel</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className={`btn ${isMuted ? 'btn-secondary' : 'btn-primary'}`} onClick={audioStarted ? toggleMute : startAudio}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            {isMuted ? 'Audio Off' : 'Audio On'}
          </button>
          <button className="btn btn-danger" onClick={resetAuction} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            <RefreshCw size={18} /> RESET
          </button>
        </div>
      </div>
      
      {activePlayer && (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '15px' }}>Live Bidding: {activePlayer.name}</h2>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
            <PlayerPhoto name={activePlayer.name} className="player-photo-small" style={{ width: '80px', height: '80px' }} />
            <div>
              <div className="price-display" style={{ margin: 0, fontSize: '3rem' }}>₹{auctionState.currentPrice}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Highest Bidder: <strong style={{ color: 'white' }}>{auctionState.lastBidTeam || 'None'}</strong></div>
            </div>
          </div>

          <div className="controls-grid">
            <button className="btn btn-secondary" onClick={() => updatePrice(20)}>+ ₹20</button>
            <button className="btn btn-secondary" onClick={() => updatePrice(-20)}>- ₹20</button>
            <button className="btn btn-secondary" onClick={() => updatePrice(50)}>+ ₹50</button>
            <button className="btn btn-secondary" onClick={() => updatePrice(-50)}>- ₹50</button>
            <button className="btn btn-secondary" onClick={() => updatePrice(100)}>+ ₹100</button>
            <button className="btn btn-secondary" onClick={() => updatePrice(-100)}>- ₹100</button>
            <button className="btn btn-secondary" onClick={() => updatePrice(200)}>+ ₹200</button>
            <button className="btn btn-secondary" onClick={() => updatePrice(-200)}>- ₹200</button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <input 
              type="number" 
              className="edit-input" 
              style={{ flex: 1 }} 
              placeholder="Custom amount" 
              value={customPrice || ''} 
              onChange={(e) => setCustomPrice(parseInt(e.target.value) || 0)} 
            />
            <button className="btn btn-primary" onClick={() => { updatePrice(customPrice); setCustomPrice(0); }}>Add</button>
            <button className="btn btn-secondary" onClick={() => { updatePrice(-customPrice); setCustomPrice(0); }}>Sub</button>
          </div>

          <h3 style={{ margin: '15px 0' }}>Assign Bid To:</h3>
          <div className="team-btn-grid">
            {TEAMS.map(team => (
              <button 
                key={team.id} 
                className={`btn ${auctionState.lastBidTeam === team.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setBidTeam(team.id)}
              >
                {team.name}
              </button>
            ))}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button className="btn btn-success" style={{ flex: 2, padding: '15px', fontSize: '1.2rem' }} onClick={markSoldOut}>
              <CheckCircle /> SOLD OUT
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={clearCurrentBid}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Global Controls</h2>
        <div className="controls-grid">
          <button className={`btn ${auctionState.isPublished ? 'btn-danger' : 'btn-primary'}`} onClick={togglePublish}>
            <RefreshCw /> {auctionState.isPublished ? 'Unpublish Results' : 'Publish Results'}
          </button>
          <button className="btn btn-secondary" onClick={downloadExcel}>
            <Download /> Download Excel
          </button>
          <button className="btn btn-danger" onClick={resetAuction}>
            <RefreshCw /> Reset Auction
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Add New Player</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            className="edit-input" 
            style={{ flex: 1 }} 
            placeholder="Enter player name" 
            value={newPlayerName} 
            onChange={(e) => setNewPlayerName(e.target.value)} 
          />
          <button className="btn btn-primary" onClick={addNewPlayer}>Add Player</button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Players List</h2>
        <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Object.values(players).map((p: any) => (
            <div key={p.id} className="player-list-item glass-panel" style={{ margin: 0, padding: '10px 15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                <PlayerPhoto name={p.name} className="player-photo-small" style={{ width: '50px', height: '50px' }} />
                {editingPlayerId === p.id ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      className="edit-input" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                    />
                    <button className="btn btn-success" onClick={() => savePlayerEdit(p.id)}><Save size={16} /></button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div className={`status-badge ${p.isSold ? 'status-sold' : 'status-available'}`} style={{ marginTop: '5px', display: 'inline-block' }}>
                      {p.isSold ? `Sold to ${p.soldTo} for ₹${p.price}` : 'Available'}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {!p.isSold && !activePlayer && (
                  <button className="btn btn-primary" onClick={() => selectPlayerForBidding(p.id)}><Play size={16} /> Bid</button>
                )}
                {editingPlayerId !== p.id && (
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button className="btn btn-secondary" onClick={() => { setEditingPlayerId(p.id); setEditName(p.name); }} title="Edit Player"><Edit2 size={16} /></button>
                    <button className="btn btn-danger" onClick={() => deletePlayer(p.id)} title="Delete Player"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
