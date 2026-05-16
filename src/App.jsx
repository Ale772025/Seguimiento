import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  BarChart3, 
  Calendar, 
  FileText, 
  Plus, 
  Download, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Filter,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Configuración de Google Sheets (a rellenar por el usuario)
const GAS_APP_URL = 'https://script.google.com/a/macros/donorionevictoria.com.ar/s/AKfycbw0Znro2greOtHPcnLXDXZ9TJhv3jIh6mt7SQv88gk_QlFpumU0dD04DmpIJqeGYw9n/exec'; 

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    nombre: '',
    materia: '',
    curso: '',
    periodoId: '',
    estado: 'Pendiente'
  });

  // Cargar datos desde Google Sheets
  useEffect(() => {
    const fetchData = async () => {
      if (!GAS_APP_URL) {
        // Cargar datos de ejemplo si no hay URL configurada
        setPeriods([
          { id: '1', nombre: 'Febrero 2026', estado: 'Activo' },
          { id: '2', nombre: 'Diciembre 2025', estado: 'Cerrado' },
        ]);
        setStudents([
          { id: '1', nombre: 'Juan Pérez', materia: 'Matemática', curso: '4to A', periodoId: '1', estado: 'Aprobado' },
          { id: '2', nombre: 'Ana García', materia: 'Física', curso: '5to B', periodoId: '1', estado: 'Pendiente' },
          { id: '3', nombre: 'Luis Sosa', materia: 'Historia', curso: '3er C', periodoId: '2', estado: 'Desaprobado' },
          { id: '4', nombre: 'Marta López', materia: 'Inglés', curso: '4to A', periodoId: '1', estado: 'Aprobado' },
          { id: '5', nombre: 'Pedro Ruiz', materia: 'Matemática', curso: '5to B', periodoId: '2', estado: 'Aprobado' },
        ]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(GAS_APP_URL);
        const data = await response.json();
        setStudents(data.estudiantes || []);
        setPeriods(data.periodos || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
        // Si falla la carga, inicializamos con arrays vacíos para evitar errores en el render
        setStudents([]);
        setPeriods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Estadísticas del Dashboard
  const stats = useMemo(() => {
    const total = students.length;
    const aprobados = students.filter(s => s.estado === 'Aprobado').length;
    const pendientes = students.filter(s => s.estado === 'Pendiente').length;
    const porcentajeAprobacion = total > 0 ? ((aprobados / (total - pendientes || 1)) * 100).toFixed(1) : 0;

    return { total, aprobados, pendientes, porcentajeAprobacion };
  }, [students]);

  // Datos para gráfico de barras por periodo
  const chartData = useMemo(() => {
    return periods.map(p => {
      const pStudents = students.filter(s => s.periodoId === p.id);
      const approved = pStudents.filter(s => s.estado === 'Aprobado').length;
      return {
        name: p.nombre,
        aprobados: approved,
        total: pStudents.length
      };
    });
  }, [periods, students]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const student = { ...newStudent, id: Date.now().toString() };
    
    if (GAS_APP_URL) {
      try {
        await fetch(GAS_APP_URL, {
          method: 'POST',
          mode: 'no-cors', // GAS requiere no-cors o redirección compleja
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheet: 'Estudiantes',
            action: 'add',
            row: [student.id, student.nombre, student.materia, student.curso, student.periodoId, student.estado]
          })
        });
      } catch (error) {
        console.error("Error guardando:", error);
      }
    }

    setStudents([...students, student]);
    setIsModalOpen(false);
    setNewStudent({ nombre: '', materia: '', curso: '', periodoId: '', estado: 'Pendiente' });
  };

  const generatePDF = (filterType, filterValue) => {
    const doc = jsPDF();
    const title = filterType === 'total' ? 'Informe General de Intensificación' : `Informe: ${filterValue}`;
    
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 20, 30);

    let filteredData = students;
    if (filterType === 'curso') filteredData = students.filter(s => s.curso === filterValue);
    if (filterType === 'alumno') filteredData = students.filter(s => s.nombre === filterValue);

    const tableData = filteredData.map(s => [
      s.nombre, 
      s.materia, 
      s.curso, 
      periods.find(p => p.id === s.periodoId)?.nombre || 'N/A', 
      s.estado
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Nombre', 'Materia', 'Curso', 'Periodo', 'Estado']],
      body: tableData,
    });

    doc.save(`informe-${filterType}-${filterValue || 'general'}.pdf`);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 'bold' }}>Cargando sistema...</div>;
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <BarChart3 size={32} />
          <span>EduStat</span>
        </div>
        <nav className="nav-links">
          <a className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <BarChart3 size={20} /> Dashboard
          </a>
          <a className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
            <Users size={20} /> Estudiantes
          </a>
          <a className={`nav-item ${activeTab === 'periods' ? 'active' : ''}`} onClick={() => setActiveTab('periods')}>
            <Calendar size={20} /> Periodos
          </a>
          <a className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <FileText size={20} /> Informes
          </a>
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <a className="nav-item">
            <LogOut size={20} /> Cerrar Sesión
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header>
          <div>
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Seguimiento de periodos de intensificación educativa</p>
          </div>
          {activeTab === 'students' && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={20} /> Agregar Alumno
            </button>
          ) || activeTab === 'dashboard' && (
             <button className="btn btn-outline" onClick={() => generatePDF('total')}>
               <Download size={20} /> Informe General
             </button>
          )}
        </header>

        {activeTab === 'dashboard' && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Alumnos</h3>
                <div className="value">{stats.total}</div>
                <div className="trend"><Clock size={14} /> En periodos activos</div>
              </div>
              <div className="stat-card">
                <h3>Tasa de Aprobación</h3>
                <div className="value">{stats.porcentajeAprobacion}%</div>
                <div className="trend trend-up"><TrendingUp size={14} /> +2.5% vs previo</div>
              </div>
              <div className="stat-card">
                <h3>Aprobados</h3>
                <div className="value">{stats.aprobados}</div>
                <div className="trend trend-up"><CheckCircle2 size={14} /> Completados</div>
              </div>
              <div className="stat-card">
                <h3>Pendientes</h3>
                <div className="value">{stats.pendientes}</div>
                <div className="trend trend-down"><XCircle size={14} /> En proceso</div>
              </div>
            </div>

            <div className="chart-container">
              <h3>Rendimiento por Periodo</h3>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{fill: '#f1f5f9'}} />
                  <Bar dataKey="aprobados" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} name="Alumnos Aprobados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === 'students' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Materia</th>
                  <th>Curso</th>
                  <th>Periodo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.nombre}</td>
                    <td>{s.materia}</td>
                    <td>{s.curso}</td>
                    <td>{periods.find(p => p.id === s.periodoId)?.nombre}</td>
                    <td>
                      <span className={`status-badge status-${s.estado.toLowerCase()}`}>
                        {s.estado}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '4px 8px' }}>Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'periods' && (
          <div className="stats-grid">
            {periods.map(p => (
              <div key={p.id} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Periodo</h3>
                  <span className={`status-badge ${p.estado === 'Activo' ? 'status-aprobado' : 'status-desaprobado'}`}>
                    {p.estado}
                  </span>
                </div>
                <div className="value">{p.nombre}</div>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                  {students.filter(s => s.periodoId === p.id).length} alumnos registrados
                </p>
              </div>
            ))}
            <div className="stat-card" style={{ border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
               <Plus size={32} color="var(--border)" />
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Informe por Curso</h3>
              <p>Genera un resumen detallado de una división específica.</p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <select className="form-control" id="courseSelect">
                  {[...new Set(students.map(s => s.curso))].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button className="btn btn-primary" onClick={() => generatePDF('curso', document.getElementById('courseSelect').value)}>
                  Exportar
                </button>
              </div>
            </div>
            <div className="stat-card">
              <h3>Informe por Alumno</h3>
              <p>Historial completo de materias intensificadas por estudiante.</p>
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <select className="form-control" id="studentSelect">
                  {students.map(s => <option key={s.id} value={s.nombre}>{s.nombre}</option>)}
                </select>
                <button className="btn btn-primary" onClick={() => generatePDF('alumno', document.getElementById('studentSelect').value)}>
                  Exportar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Agregar Alumno */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Cargar Estudiante</h2>
            <form onSubmit={handleAddStudent} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input 
                  className="form-control" 
                  value={newStudent.nombre} 
                  onChange={e => setNewStudent({...newStudent, nombre: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Materia</label>
                <input 
                  className="form-control" 
                  value={newStudent.materia} 
                  onChange={e => setNewStudent({...newStudent, materia: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Curso / División</label>
                <input 
                  className="form-control" 
                  value={newStudent.curso} 
                  onChange={e => setNewStudent({...newStudent, curso: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Periodo</label>
                <select 
                  className="form-control" 
                  value={newStudent.periodoId} 
                  onChange={e => setNewStudent({...newStudent, periodoId: e.target.value})} 
                  required
                >
                  <option value="">Seleccionar periodo</option>
                  {periods.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Estado Inicial</label>
                <select 
                  className="form-control" 
                  value={newStudent.estado} 
                  onChange={e => setNewStudent({...newStudent, estado: e.target.value})}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobado">Aprobado</option>
                  <option value="Desaprobado">Desaprobado</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
