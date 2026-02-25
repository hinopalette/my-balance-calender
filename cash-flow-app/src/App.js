import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

function App() {
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem('accounts');
    return saved ? JSON.parse(saved) : [{ id: '1', name: 'メイン銀行', initialBalance: 0 }];
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [newAccountName, setNewAccountName] = useState('');
  const [initialBalanceInput, setInitialBalanceInput] = useState('');
  const [editingAccountId, setEditingAccountId] = useState(null);

  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [targetAccountId, setTargetAccountId] = useState(accounts[0]?.id || '1');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [accounts, transactions]);

  const clearAllData = () => {
    if (window.confirm("【警告】すべての口座と予定を完全に削除しますか？")) {
      if (window.confirm("本当によろしいですか？この操作は取り消せません。")) {
        setAccounts([{ id: '1', name: 'メイン銀行', initialBalance: 0 }]);
        setTransactions([]);
        localStorage.clear();
        alert("すべてのデータを削除しました。");
        window.location.reload();
      }
    }
  };

  const inputStyle = { padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none', flex: 1 };
  const buttonStyle = { padding: '12px 20px', fontSize: '16px', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', border: 'none', transition: '0.3s' };

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    if (!newAccountName) return;
    const balance = initialBalanceInput === '' ? 0 : Number(initialBalanceInput);
    if (editingAccountId) {
      setAccounts(accounts.map(acc => acc.id === editingAccountId ? { ...acc, name: newAccountName, initialBalance: balance } : acc));
      setEditingAccountId(null);
    } else {
      setAccounts([...accounts, { id: Date.now().toString(), name: newAccountName, initialBalance: balance }]);
    }
    setNewAccountName(''); setInitialBalanceInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setTransactions(transactions.map(t => t.id === editingId ? { ...t, title, amount: Number(amount), date, accountId: targetAccountId } : t));
      setEditingId(null);
    } else {
      setTransactions([...transactions, { id: Date.now(), title, amount: Number(amount), date, accountId: targetAccountId }]);
    }
    setTitle(''); setAmount(''); setDate('');
  };

  const deleteAccount = (id) => {
    if (accounts.length === 1) { alert('最後の口座は削除できません。'); return; }
    if (window.confirm('この口座を削除しますか？')) {
      setAccounts(accounts.filter(acc => acc.id !== id));
      setTransactions(transactions.filter(t => t.accountId !== id));
    }
  };

  const getDailyStats = () => {
    let filtered = transactions;
    let startBalance = 0;
    if (selectedAccountId !== 'all') {
      filtered = transactions.filter(t => t.accountId === selectedAccountId);
      const acc = accounts.find(a => a.id === selectedAccountId);
      startBalance = acc ? acc.initialBalance : 0;
    } else {
      startBalance = accounts.reduce((sum, acc) => sum + acc.initialBalance, 0);
    }
    const uniqueDates = [...new Set(filtered.map(t => t.date))].sort();
    let cumulative = startBalance;
    const stats = {};
    uniqueDates.forEach(d => {
      const dayTxs = filtered.filter(t => t.date === d);
      cumulative += dayTxs.reduce((sum, t) => sum + t.amount, 0);
      stats[d] = { balance: cumulative, txs: dayTxs };
    });
    return { stats, filtered };
  };

  const { stats, filtered } = getDailyStats();

  const events = [
    ...filtered.map(t => ({ 
      title: `${t.title}: ${t.amount.toLocaleString()}円`, 
      start: t.date, 
      color: t.amount > 0 ? '#28a745' : '#dc3545',
      className: 'plan-event'
    })),
    ...Object.keys(stats).map(d => ({ 
      title: `💰${stats[d].balance.toLocaleString()}円`, 
      start: d, 
      color: 'transparent', 
      textColor: '#d35400',
      className: 'balance-event'
    }))
  ];

  const renderDayCellContent = (dayInfo) => {
    const y = dayInfo.date.getFullYear();
    const m = String(dayInfo.date.getMonth() + 1).padStart(2, '0');
    const d = String(dayInfo.date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`; 
    const data = stats[dateStr];
    return (
      <div className="day-cell-container">
        <span className="fc-daygrid-day-number">{dayInfo.dayNumberText}</span>
        {data && (
          <div className="custom-tooltip">
            <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ddd', marginBottom: '5px' }}>{dateStr}</div>
            <div style={{ color: '#ffcc00', fontWeight: 'bold' }}>残高: {data.balance.toLocaleString()}円</div>
            <div style={{ fontSize: '0.8em', marginTop: '5px' }}>
              {data.txs.map((t, i) => <div key={i} style={{textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap'}}>・{t.title}</div>)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1300px', margin: '0 auto', fontFamily: 'sans-serif', color: '#333', backgroundColor: '#fdfdfd' }}>
      <style>{`
        .day-cell-container { position: relative; width: 100%; height: 100%; }
        .custom-tooltip {
          visibility: hidden; opacity: 0; position: absolute; left: 50%; bottom: 100%; transform: translateX(-50%);
          background: rgba(45, 45, 45, 0.98); color: #fff; padding: 12px; border-radius: 8px; z-index: 999; width: 200px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.3); pointer-events: none; transition: opacity 0.2s;
        }
        .fc-daygrid-day:hover .custom-tooltip { visibility: visible; opacity: 1; }
        .balance-event { font-size: 1.1em !important; font-weight: 900 !important; color: #d35400 !important; }
        .plan-event { font-size: 0.85em; }
        .fc-day-today { background-color: #fff9e6 !important; }
      `}</style>

      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '42px', margin: '0', background: 'linear-gradient(45deg, #1a73e8 30%, #64b5f6 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '900' }}>
          未来の残高カレンダー
        </h1>
      </header>

      {/* 口座登録 */}
      <div style={{ padding: '25px', background: '#f0f4f8', borderRadius: '16px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, borderLeft: '5px solid #2196f3', paddingLeft: '10px' }}>口座登録</h3>
        <form onSubmit={handleAccountSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input style={inputStyle} type="text" placeholder="口座名" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} required />
          <input style={inputStyle} type="number" placeholder="初期残高" value={initialBalanceInput} onChange={(e) => setInitialBalanceInput(e.target.value)} />
          <button type="submit" style={{ ...buttonStyle, background: '#333', color: 'white' }}>{editingAccountId ? '更新' : '登録'}</button>
        </form>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
          {accounts.map(acc => (
            <div key={acc.id} style={{ background: '#fff', padding: '5px 12px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
              <strong>{acc.name}</strong>: {acc.initialBalance.toLocaleString()}円
              <button onClick={() => deleteAccount(acc.id)} style={{ marginLeft: '8px', color: '#ff4d4f', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>×</button>
            </div>
          ))}
        </div>
      </div>

      {/* 予定追加 */}
      <div style={{ padding: '25px', background: editingId ? '#fff3cd' : '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, borderLeft: '5px solid #ffc107', paddingLeft: '10px' }}>{editingId ? '予定を編集' : '予定追加'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input style={inputStyle} type="text" placeholder="項目" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <input style={inputStyle} type="number" placeholder="金額" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <select style={{ ...inputStyle, flex: '0 1 150px' }} value={targetAccountId} onChange={(e) => setTargetAccountId(e.target.value)}>
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </select>
          <button type="submit" style={{ ...buttonStyle, background: editingId ? '#ffc107' : '#28a745', color: editingId ? '#333' : 'white' }}>
            {editingId ? '更新' : '追加'}
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '30px' }}>
        {/* 左側：カレンダー */}
        <div>
          <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'flex-end' }}>
            <select style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}>
              <option value="all">すべての口座を合算</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 25px rgba(0,0,0,0.1)' }}>
            <FullCalendar 
              plugins={[dayGridPlugin]} initialView="dayGridMonth" events={events} locale="ja" height="auto"
              showNonCurrentDates={false} fixedWeekCount={false} dayCellContent={renderDayCellContent}
            />
          </div>
          {/* 凡例をカレンダー下の右側に配置 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', paddingRight: '10px' }}>
            <div style={{ fontWeight: 900, color: '#d35400', fontSize: '0.95em' }}>💰 その日の最終的な口座残高</div>
          </div>
        </div>

        {/* 右側：予定リスト */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ padding: '25px', background: '#fff', borderRadius: '20px', boxShadow: '0 4px 25px rgba(0,0,0,0.1)', maxHeight: '600px', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, paddingBottom: '10px', borderBottom: '2px solid #f0f0f0' }}>📋 予定リスト</h3>
            {transactions.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', marginTop: '20px' }}>予定がありません</p>
            ) : (
              transactions.sort((a,b) => new Date(a.date) - new Date(b.date)).map(t => (
                <div key={t.id} style={{ borderBottom: '1px solid #f5f5f5', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <small style={{ color: '#999' }}>{t.date}</small><br />
                    <strong style={{ fontSize: '15px' }}>{t.title}</strong><br />
                    <span style={{ color: t.amount > 0 ? '#2e7d32' : '#d32f2f', fontWeight: 'bold' }}>{t.amount.toLocaleString()}円</span>
                  </div>
                  <button onClick={() => { if(window.confirm('削除しますか？')) setTransactions(transactions.filter(item => item.id !== t.id)); }} style={{ border: 'none', background: 'none', color: '#ff4d4f', fontSize: '20px', cursor: 'pointer', padding: '5px' }}>×</button>
                </div>
              ))
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={clearAllData} 
              style={{ background: 'none', border: '1px solid #ff4d4f', color: '#ff4d4f', padding: '10px 15px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold', width: '100%', transition: '0.3s' }}
              onMouseEnter={(e) => { e.target.style.background = '#fff1f0' }}
              onMouseLeave={(e) => { e.target.style.background = 'none' }}
            >
              🗑️ 全データをリセット（削除）
            </button>
            <p style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>※すべての口座と予定が消去されます</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;