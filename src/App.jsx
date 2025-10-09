import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, Plus, User, LogOut, MessageSquare, Clock, Users, CheckCircle, Circle, AlertCircle, Settings, UserPlus, FileText, Paperclip, Calendar, AlertTriangle, X, BarChart3, Download } from 'lucide-react';

const supabaseUrl = 'https://meovxpvkwrjsrdnpybig.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lb3Z4cHZrd3Jqc3JkbnB5YmlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3OTQ1MTUsImV4cCI6MjA3NTM3MDUxNX0.5em93qQXhjMIfqG6szhbY8oSpx92vcAvk_OFIaGs3JY';
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
      console.error('Erro:', error);
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

  const handleCreateTask = async () => {
    if (!formTask.title || !formTask.responsible || !formTask.deadline) {
      alert('Preencha título, responsável e prazo');
      return;
    }

    try {
      const { data: newTask } = await supabase.from('tasks').insert({
        title: formTask.title,
        description: formTask.description,
        area: formTask.area,
        responsible: parseInt(formTask.responsible),
        status: 'Pendente',
        priority: formTask.priority,
        deadline: formTask.deadline,
        created_by: currentUser.id
      }).select().single();

      if (formTask.team.length > 0) {
        const teamInserts = formTask.team.map(userId => ({
          task_id: newTask.id,
          user_id: parseInt(userId)
        }));
        await supabase.from('task_team').insert(teamInserts);
      }

      await loadData();
      alert('✅ Tarefa criada!');
      setShowNewTask(false);
      setFormTask({ title: '', description: '', area: 'Infraestrutura', responsible: '', team: [], priority: 'Média', deadline: '' });
    } catch (error) {
      console.error('Erro:', error);
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
      console.error('Erro:', error);
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
      console.error('Erro:', error);
      alert('Erro ao atualizar');
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
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleChangeStatus = async (tid, status) => {
    try {
      await supabase.from('tasks').update({ status }).eq('id', tid);
      await loadData();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const getUserName = (id) => users.find(u => u.id === id)?.name || 'Usuário';
  const getUserAvatar = (id) => users.find(u => u.id === id)?.avatar || '👤';
  const getStatusColor = (s) => ({ 'Pendente': 'bg-gray-100 text-gray-700', 'Em andamento': 'bg-slate-100 text-slate-700', 'Concluída': 'bg-slate-200 text-slate-800' }[s]);
  const getPriorityColor = (p) => ({ 'Alta': 'bg-gray-700 text-white', 'Média': 'bg-gray-400 text-white', 'Baixa': 'bg-gray-200 text-gray-700' }[p]);
  const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR');

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-2xl font-bold">Carregando...</div></div>;
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-700 mb-4">
              <span className="text-4xl text-white font-bold">N</span>
            </div>
            <h1 className="text-3xl font-bold">Nexus</h1>
          </div>
          <div className="space-y-4">
            <input type="email" id="email" placeholder="Email" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg" />
            <input type="password" id="password" placeholder="Senha" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg" />
            <button onClick={() => handleLogin(document.getElementById('email').value, document.getElementById('password').value)}
              className="w-full px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium">
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-slate-800 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center font-bold">N</div>
            <div><h1 className="text-2xl font-bold">Nexus</h1></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowDash(true)} className="p-2 hover:bg-slate-700 rounded-lg"><BarChart3 className="w-5 h-5" /></button>
            {(currentUser.role === 'Gerente' || currentUser.role === 'Diretor') && (
              <button onClick={() => setShowUsers(true)} className="p-2 hover:bg-slate-700 rounded-lg"><UserPlus className="w-5 h-5" /></button>
            )}
            <button onClick={() => { setEditProfile({...currentUser}); setShowProfile(true); }} className="p-2 hover:bg-slate-700 rounded-lg"><Settings className="w-5 h-5" /></button>
            <div className="text-2xl">{currentUser.avatar}</div>
            <button onClick={() => { setLoggedIn(false); setCurrentUser(null); }} className="p-2 hover:bg-slate-700 rounded-lg"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex gap-3">
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg" />
            {(currentUser.role === 'Gerente' || currentUser.role === 'Diretor') && (
              <button onClick={() => setShowNewTask(true)} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5" />Nova Tarefa
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} onClick={() => setSelectedTask(task)}
                className="bg-white rounded-xl shadow-lg p-5 cursor-pointer border-2 border-gray-300 hover:border-slate-600">
                <h3 className="font-bold text-lg mb-1">{task.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>{task.status}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                </div>
              </div>
            ))}
          </div>

          {selectedTask ? (
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-300">
              <h2 className="text-2xl font-bold mb-4">{selectedTask.title}</h2>
              <p className="mb-4">{selectedTask.description}</p>
              
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
                      <p className="text-sm">{c.text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Comentar..." className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg" />
                  <button onClick={() => handleAddComment(selectedTask.id)} className="px-4 py-2 bg-slate-700 text-white rounded-lg">Enviar</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
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
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-100 p-4 rounded-lg"><p className="text-sm">Total</p><p className="text-3xl font-bold">{tasks.length}</p></div>
            </div>
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
              <button onClick={handleCreateTask} className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">Criar</button>
            </div>
          </div>
        </div>
      )}

      {showUsers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between mb-4">
              <h2 className="text-2xl font-bold">Criar Usuário</h2>
              <button onClick={() => setShowUsers(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Nome" value={formUser.name} onChange={(e) => setFormUser({...formUser, name: e.target.value})} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
              <input type="email" placeholder="Email" value={formUser.email} onChange={(e) => setFormUser({...formUser, email: e.target.value})} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
              <input type="password" placeholder="Senha" value={formUser.password} onChange={(e) => setFormUser({...formUser, password: e.target.value})} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
              <input type="text" placeholder="Departamento" value={formUser.department} onChange={(e) => setFormUser({...formUser, department: e.target.value})} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
              <button onClick={handleCreateUser} className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">Criar</button>
            </div>
          </div>
        </div>
      )}

      {showProfile && editProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between mb-4">
              <h2 className="text-2xl font-bold">Meu Perfil</h2>
              <button onClick={() => setShowProfile(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" placeholder="Avatar" value={editProfile.avatar} onChange={(e) => setEditProfile({...editProfile, avatar: e.target.value})} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
              <input type="text" placeholder="Nome" value={editProfile.name} onChange={(e) => setEditProfile({...editProfile, name: e.target.value})} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
              <input type="tel" placeholder="Telefone" value={editProfile.phone} onChange={(e) => setEditProfile({...editProfile, phone: e.target.value})} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg" />
              <button onClick={handleUpdateProfile} className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
