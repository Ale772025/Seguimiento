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
const GAS_APP_URL = 'https://script.google.com/macros/s/AKfycbwdY5v4YVvFq4s_gu2EVk0_4mnQcGeF_RTIHNPlb5j4dPc5QlpcScSeGwou0NUIq2kt/exec'; 

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    nombre: '',
    cursoOrigen: '',
    materia: '',
    curso: '',
    periodo: '',
    estado: 'Pendiente'
  });

  // Cargar datos desde Google Sheets
  useEffect(() => {
    const fetchData = async () => {
      if (!GAS_APP_URL) {
        // Cargar datos de ejemplo si no hay URL configurada
        setStudents([
          { id: '1', nombre: 'Juan Pérez', cursoOrigen: '3ro A', materia: 'Matemática', curso: '4to A', periodo: 'Febrero 2026', estado: 'Aprobado' },
          { id: '2', nombre: 'Ana García', cursoOrigen: '4to B', materia: 'Física', curso: '5to B', periodo: 'Febrero 2026', estado: 'Pendiente' },
          { id: '3', nombre: 'Luis Sosa', cursoOrigen: '2do C', materia: 'Historia', curso: '3er C', periodo: 'Diciembre 2025', estado: 'Desaprobado' },
          { id: '4', nombre: 'Marta López', cursoOrigen: '3ro A', materia: 'Inglés', curso: '4to A', periodo: 'Febrero 2026', estado: 'Aprobado' },
          { id: '5', nombre: 'Pedro Ruiz', cursoOrigen: '4to B', materia: 'Matemática', curso: '5to B', periodo: 'Diciembre 2025', estado: 'Aprobado' },
        ]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(GAS_APP_URL);
        const data = await response.json();
        setStudents(data.estudiantes || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
        // Si falla la carga, inicializamos con arrays vacíos para evitar errores en el render
        setStudents([]);
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
    const uniquePeriods = [...new Set(students.map(s => s.periodo))];
    return uniquePeriods.map(p => {
      const pStudents = students.filter(s => s.periodo === p);
      const approved = pStudents.filter(s => s.estado === 'Aprobado').length;
      return {
        name: p || 'Sin definir',
        aprobados: approved,
        total: pStudents.length
      };
    });
  }, [students]);

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
            row: [student.id, student.nombre, student.cursoOrigen, student.materia, student.curso, student.periodo, student.estado]
          })
        });
      } catch (error) {
        console.error("Error guardando:", error);
      }
    }

    setStudents([...students, student]);
    setIsModalOpen(false);
    setNewStudent({ nombre: '', cursoOrigen: '', materia: '', curso: '', periodo: '', estado: 'Pendiente' });
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const studentToUpdate = students.find(s => s.id === id);
    if (!studentToUpdate) return;

    const updatedStudent = { ...studentToUpdate, estado: newStatus };
    
    if (GAS_APP_URL) {
      try {
        await fetch(GAS_APP_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheet: 'Estudiantes',
            action: 'update',
            id: id,
            row: [updatedStudent.id, updatedStudent.nombre, updatedStudent.cursoOrigen, updatedStudent.materia, updatedStudent.curso, updatedStudent.periodo, updatedStudent.estado]
          })
        });
      } catch (error) {
        console.error("Error actualizando:", error);
      }
    }

    setStudents(students.map(s => s.id === id ? updatedStudent : s));
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
      s.cursoOrigen || '-',
      s.materia, 
      s.curso, 
      s.periodo || 'N/A', 
      s.estado
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Nombre', 'Curso de Origen', 'Materia', 'Intensifica en', 'Periodo', 'Estado']],
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
                  <th>Curso de Origen</th>
                  <th>Materia</th>
                  <th>Intensifica en</th>
                  <th>Periodo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.nombre}</td>
                    <td>{s.cursoOrigen || '-'}</td>
                    <td>{s.materia}</td>
                    <td>{s.curso}</td>
                    <td>{s.periodo}</td>
                    <td>
                      <span className={`status-badge status-${s.estado.toLowerCase()}`}>
                        {s.estado}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '4px 8px' }}
                        onClick={() => {
                          setSelectedStudent(s);
                          setIsViewModalOpen(true);
                        }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Informe por Intensifica en</h3>
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

      {/* Modal Ver/Editar Alumno */}
      {isViewModalOpen && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Detalles de Intensificación</h2>
              <button className="btn btn-outline" style={{ padding: '4px' }} onClick={() => setIsViewModalOpen(false)}>
                <XCircle size={24} />
              </button>
            </div>
            
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)' }}>{selectedStudent.nombre}</h3>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)' }}>
                <strong>Materia:</strong> {selectedStudent.materia} <br/>
                <strong>Curso de Origen:</strong> {selectedStudent.cursoOrigen || '-'} <br/>
                <strong>Intensifica en:</strong> {selectedStudent.curso}
              </p>
            </div>

            <h3>Historial de Intentos</h3>
            <div style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => s.nombre === selectedStudent.nombre && s.materia === selectedStudent.materia).map(s => (
                    <tr key={s.id}>
                      <td>{s.periodo}</td>
                      <td>
                        <span className={`status-badge status-${s.estado.toLowerCase()}`}>
                          {s.estado}
                        </span>
                      </td>
                      <td>
                        <select 
                          className="form-control"
                          style={{ padding: '4px', fontSize: '0.875rem' }}
                          value={s.estado}
                          onChange={(e) => handleUpdateStatus(s.id, e.target.value)}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Aprobado">Aprobado</option>
                          <option value="Desaprobado">Desaprobado</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                onClick={() => {
                  setNewStudent({
                    nombre: selectedStudent.nombre,
                    cursoOrigen: selectedStudent.cursoOrigen,
                    materia: selectedStudent.materia,
                    curso: selectedStudent.curso,
                    periodo: '',
                    estado: 'Pendiente'
                  });
                  setIsViewModalOpen(false);
                  setIsModalOpen(true);
                }}
              >
                <Plus size={20} /> Añadir Nuevo Intento
              </button>
            </div>
          </div>
        </div>
      )}

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
                <label>Curso de Origen</label>
                <input 
                  className="form-control" 
                  value={newStudent.cursoOrigen || ''} 
                  onChange={e => setNewStudent({...newStudent, cursoOrigen: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Intensifica en</label>
                <input 
                  className="form-control" 
                  value={newStudent.curso} 
                  onChange={e => setNewStudent({...newStudent, curso: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Mes / Periodo</label>
                <input 
                  className="form-control" 
                  placeholder="Ej: Julio 2026"
                  value={newStudent.periodo} 
                  onChange={e => setNewStudent({...newStudent, periodo: e.target.value})} 
                  required
                />
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
