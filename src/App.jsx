import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Plus, User, LogOut, MessageSquare, Clock, Users, CheckCircle, Circle, AlertCircle, Settings, UserPlus, FileText, Paperclip, Calendar, AlertTriangle, X, BarChart3, Download } from 'lucide-react';

const supabaseUrl = 'https://mqklxpyctsykgocpezji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xa2x4cHljdHN5a2dvY3BlemppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3OTIxNTUsImV4cCI6MjA3NTM2ODE1NX0.kfcKPjfrqS4i2PiMl5-O4PpS0nqM2x3ktfkm8isANg0';
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todas');
  const [filterArea, setFilterArea] = useState('Todas');
  const [filterProf, setFilterProf] = useState('Todos');
  const [filterPriority, setFilterPriority] = useState('Todas');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDash, setShowDash] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [formTask, setFormTask] = useState({ title: '', description: '', area: 'Infraestrutura', responsible: '', team: [], priority: 'Média', deadline: '' });
  const [formUser, setFormUser] = useState({ name: '', email: '', password: '', role: 'Profissional', department: '' });
  const [editProfile, setEditProfile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: usersData } = await supabase.from('users').select('*');
      const { data: tasksData } = await supabase.from('tasks').select('*, task_team(user_id), comments(*), attachments(*)');
      
      const tasksFormatted = tasksData?.map(t => ({
        ...t,
        team: t.task_team?.map(tt => tt.user_id) || [],
        comments: t.comments || [],
        attachments: t.attachments || []
      })) || [];

      setUsers(usersData || []);
      setTasks(tasksFormatted);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      setLoggedIn(true);
    } else {
      alert('Email ou senha incorretos');
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setCurrentUser(null);
    setSelectedTask(null);
  };

  const handleCreateTask = async () => {
    if (!formTask.title || !formTask.responsible || !formTask.deadline) {
      alert('Preencha título, responsável e prazo');
      return;
    }

    try {
      const { data: newTask, error } = await supabase.from('tasks').insert({
        title: formTask.title,
        description: formTask.description,
        area: formTask.area,
        responsible: parseInt(formTask.responsible),
        status: 'Pendente',
        priority: formTask.priority,
        deadline: formTask.deadline,
        created_by: currentUser.id
      }).select().single();

      if (error) throw error;

      if (formTask.team.length > 0) {
        const teamInserts = formTask.team.map(userId => ({
          task_id: newTask.id,
          user_id: parseInt(userId)
        }));
        await supabase.from('task_team').insert(teamInserts);
      }

      await loadData();
      const resp = users.find(u => u.id === parseInt(formTask.responsible));
      alert(`✅ Tarefa criada!\n📧 Email enviado para ${resp.name}`);
      setShowNewTask(false);
      setFormTask({ title: '', description: '', area: 'Infraestrutura', responsible: '', team: [], priority: 'Média', deadline: '' });
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      alert('Erro ao criar tarefa');
    }
  };

  const handleCreateUser = async () => {
    if (!formUser.name || !formUser.email || !formUser.password || !formUser.department) {
      alert('Preencha todos os campos');
      return;
    }

    try {
      await supabase.from('users').insert({
        name: formUser.name,
        email: formUser.email,
        password: formUser.password,
        role: formUser.role,
        department: formUser.department
      });

      await loadData();
      setShowUsers(false);
      setFormUser({ name: '', email: '', password: '', role: 'Profissional', department: '' });
      alert('Usuário criado!');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao criar usuário');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await supabase.from('users').update({
        name: editProfile.name,
        email: editProfile.email,
        avatar: editProfile.avatar,
        phone: editProfile.phone,
        emergency: editProfile.emergency,
        birthday: editProfile.birthday,
        department: editProfile.department
      }).eq('id', currentUser.id);

      await loadData();
      setCurrentUser(editProfile);
      setShowProfile(false);
      alert('Perfil atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil');
    }
  };

  const handleChangeRole = async (id, role) => {
    try {
      await supabase.from('users').update({ role }).eq('id', id);
      await loadData();
      alert(`Cargo alterado para ${role}`);
    } catch (error) {
      console.error('Erro ao alterar cargo:', error);
    }
  };

  const handleAddComment = async (tid) => {
    if (!newComment.trim()) return;

    try {
      await supabase.from('comments').insert({
        task_id: tid,
        user_id: currentUser.id,
        text: newComment
      });

      await loadData();
      setNewComment('');
      const task = tasks.find(t => t.id === tid);
      setSelectedTask(task);
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    }
  };

  const handleAddAttachment = async (tid) => {
    const name = prompt('Nome do arquivo:');
    if (!name) return;

    try {
      await supabase.from('attachments').insert({
        task_id: tid,
        name: name,
        size: '1.2 MB',
        uploaded_by: currentUser.id
      });

      await loadData();
      alert(`Arquivo "${name}" anexado!`);
    } catch (error) {
      console.error('Erro ao anexar arquivo:', error);
    }
  };

  const handleChangeStatus = async (tid, status) => {
    try {
      await supabase.from('tasks').update({ status }).eq('id', tid);
      await loadData();
      const task = tasks.find(t => t.id === tid);
      setSelectedTask(task);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const generateReport = (uid) => {
    const user = users.find(u => u.id === uid);
    const userTasks = tasks.filter(t => (t.responsible === uid || t.team.includes(uid)));
    let report = `RELATÓRIO - ${user.name}\nTotal: ${userTasks.length}\n\n`;
    userTasks.forEach(t => { report += `${t.title} - ${t.status} - ${t.priority}\n`; });
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${user.name.replace(' ', '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('📄 Relatório baixado!');
  };

  const getFilteredTasks = () => {
    let filtered = tasks;
    if (currentUser?.role === 'Profissional') filtered = filtered.filter(t => t.responsible === currentUser.id || t.team.includes(currentUser.id));
    if (searchTerm) filtered = filtered.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterStatus !== 'Todas') filtered = filtered.filter(t => t.status === filterStatus);
    if (filterArea !== 'Todas') filtered = filtered.filter(t => t.area === filterArea);
    if (filterPriority !== 'Todas') filtered = filtered.filter(t => t.priority === filterPriority);
    if (filterProf !== 'Todos') filtered = filtered.filter(t => t.responsible === parseInt(filterProf) || t.team.includes(parseInt(filterProf)));
    return filtered;
  };

  const getUserName = (id) => users.find(u => u.id === id)?.name || 'Usuário';
  const getUserAvatar = (id) => users.find(u => u.id === id)?.avatar || '👤';
  const getStatusColor = (s) => ({ 'Pendente': 'bg-gray-100 text-gray-700 border-gray-300', 'Em andamento': 'bg-slate-100 text-slate-700 border-slate-300', 'Concluída': 'bg-slate-200 text-slate-800 border-slate-400' }[s]);
  const getPriorityColor = (p) => ({ 'Alta': 'bg-gray-700 text-white border-gray-800', 'Média': 'bg-gray-400 text-white border-gray-500', 'Baixa': 'bg-gray-200 text-gray-700 border-gray-300' }[p]);
  const isOverdue = (d, s) => s !== 'Concluída' && new Date(d) < new Date();
  const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR') + ' às ' + new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const getDashData = () => {
    const my = currentUser?.role === 'Profissional' ? tasks.filter(t => t.responsible === currentUser.id || t.team.includes(currentUser.id)) : tasks;
    return {
      total: my.length,
      pend: my.filter(t => t.status === 'Pendente').length,
      and: my.filter(t => t.status === 'Em andamento').length,
      conc: my.filter(t => t.status === 'Concluída').length,
      atr: my.filter(t => isOverdue(t.deadline, t.status)).length,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl font-bold text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-700 mb-4 shadow-lg">
              <span className="text-4xl text-white font-bold">N</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Nexus</h1>
            <p className="text-gray-500 mt-2">Sistema de Gestão de Tarefas</p>
          </div>
          <div className="space-y-4">
            <input type="email" placeholder="Email" id="email" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg" />
            <input type="password" placeholder="Senha" id="password" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg" />
            <button onClick={() => handleLogin(document.getElementById('email').value, document.getElementById('password').value)}
              className="w-full px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-all shadow-md">
              Entrar
            </button>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">Use: carlos@empresa.com / 123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-slate-800 text-white shadow-xl border-b-2 border-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center font-bold text-lg">N</div>
            <div>
              <h1 className="text-2xl font-bold">Nexus</h1>
              <p className="text-sm text-slate-300">Gestão de Tarefas</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowDash(true)} className="p-2 hover:bg-slate-700 rounded-lg" title="Dashboard"><BarChart3 className="w-5 h-5" /></button>
            {(currentUser.role === 'Gerente' || currentUser.role === 'Diretor') && (
              <>
                <button onClick={() => setShowUsers(true)} className="p-2 hover:bg-slate-700 rounded-lg" title="Usuários"><UserPlus className="w-5 h-5" /></button>
                <button onClick={() => generateReport(currentUser.id)} className="p-2 hover:bg-slate-700 rounded-lg" title="Relatório"><FileText className="w-5 h-5" /></button>
              </>
            )}
            <button onClick={() => { setEditProfile({...currentUser}); setShowProfile(true); }} className="p-2 hover:bg-slate-700 rounded-lg" title="Perfil"><Settings className="w-5 h-5" /></button>
            <div className="text-2xl">{currentUser.avatar}</div>
            <button onClick={handleLogout} className="p-2 hover:bg-slate-700 rounded-lg"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border-2 border-gray-300">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg" />
            </div>
            {(currentUser.role === 'Gerente' || currentUser.role === 'Diretor') && (
              <button onClick={() => setShowNewTask(true)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium shadow-md flex items-center gap-2">
                <Plus className="w-5 h-5" />Nova Tarefa
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {getFilteredTasks().map(task => (
              <div key={task.id} onClick={() => setSelectedTask(task)}
                className={`bg-white rounded-xl shadow-lg p-5 cursor-pointer transition-all hover:shadow-xl border-2 ${selectedTask?.id === task.id ? 'border-slate-600' : 'border-gray-300'}`}>
                <h3 className="font-bold text-lg text-gray-800 mb-1">{task.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${getStatusColor(task.status)}`}>{task.status}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedTask ? (
            <div className="bg-white rounded-xl shadow-lg p-6 lg:sticky lg:top-6 border-2 border-gray-300">
              <h2 className="text-2xl font-bold mb-4">{selectedTask.title}</h2>
              <p className="text-gray-600 mb-4">{selectedTask.description}</p>
              
              {(currentUser.role === 'Gerente' || currentUser.role === 'Diretor' || selectedTask.responsible === currentUser.id) && (
                <select value={selectedTask.status} onChange={(e) => handleChangeStatus(selectedTask.id, e.target.value)} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg mb-4">
                  <option>Pendente</option><option>Em andamento</option><option>Concluída</option>
                </select>
              )}

              <div className="border-t-2 pt-4">
                <h3 className="font-bold mb-4">Comentários</h3>
                <div className="space-y-3 mb-4">
                  {selectedTask.comments?.map(c => (
                    <div key={c.id} className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-sm">{getUserName(c.user_id)}</p>
                      <p className="text-sm text-gray-700">{c.text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Comentar..." className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg" />
                  <button onClick={() => handleAddComment(selectedTask.id)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">Enviar</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-gray-300">
              <p className="text-gray-500">Selecione uma tarefa</p>
            </div>
          )}
        </div>
      </div>

      {showDash && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl">
            <div className="flex justify-between mb-6">
              <h2 className="text-3xl font-bold">Dashboard</h2>
              <button onClick={() => setShowDash(false)}><X className="w-6 h-6" /></button>
            </div>
            {(() => {
              const d = getDashData();
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-100 p-4 rounded-lg border-2">
                    <p className="text-sm mb-1">Total</p>
                    <p className="text-3xl font-bold">{d.total}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border-2">
                    <p className="text-sm mb-1">Em Andamento</p>
                    <p className="text-3xl font-bold text-blue-700">{d.and}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border-2">
                    <p className="text-sm mb-1">Concluídas</p>
                    <p className="text-3xl font-bold text-green-700">{d.conc}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border-2">
                    <p className="text-sm mb-1">Atrasadas</p>
                    <p className="text-3xl font-bold text-red-700">{d.atr}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {showNewTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between mb-4">
              <h2 className="text-2xl font-bold">Nova Tarefa</h2>
              <button onClick={() => setShowNewTask(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Título" value={formTask.title} onChange={(e) => setFormTask({...formTask, title: e.target.value})} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
              <textarea placeholder="Descrição" value={formTask.description} onChange={(e) => setFormTask({...formTask, description: e.target.value})} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" rows="3" />
              <input type="date" value={formTask.deadline} onChange={(e) => setFormTask({...formTask, deadline: e.target.value})} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
              <select value={formTask.responsible} onChange={(e) => setFormTask({...formTask, responsible: e.target.value})} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg">
                <option value="">Responsável</option>
                {users.filter(u => u.role === 'Profissional').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <button onClick={handleCreateTask} className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium">Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
