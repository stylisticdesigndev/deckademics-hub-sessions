import { Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import ProductionStudentLayoutRoute from './ProductionStudentLayoutRoute';
import { ProductionStudentDashboard } from '@/components/production/ProductionStudentDashboard';
import { ProductionCurriculum } from '@/components/production/ProductionCurriculum';
import StudentMessages from '@/pages/student/StudentMessages';
import StudentNotes from '@/pages/student/StudentNotes';
import { ProductionStudentClasses } from '@/components/production/ProductionStudentClasses';
export function productionStudentRoutes(){return <Route element={<ProtectedRoute allowedRoles={['student']}/>}><Route element={<ProductionStudentLayoutRoute/>}><Route path="/student/production" element={<ProductionStudentDashboard/>}/><Route path="/student/production/curriculum" element={<ProductionCurriculum/>}/><Route path="/student/production/classes" element={<ProductionStudentClasses/>}/><Route path="/student/production/notes" element={<StudentNotes/>}/><Route path="/student/production/messages" element={<StudentMessages/>}/></Route></Route>;}