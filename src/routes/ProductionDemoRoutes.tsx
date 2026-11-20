import { Navigate, Route } from 'react-router-dom';
import ProductionDemoLayout from '@/components/production/demo/ProductionDemoLayout';
import { ProductionInstructorDashboard } from '@/components/production/ProductionInstructorDashboard';
import { ProductionStudentDashboard } from '@/components/production/ProductionStudentDashboard';
import { ProductionCurriculum } from '@/components/production/ProductionCurriculum';
import { DemoMessages } from '@/components/production/demo/DemoMessages';
import { DemoNotebook } from '@/components/production/demo/DemoNotebook';
import { ProductionStudentClasses } from '@/components/production/ProductionStudentClasses';
import { useProductionDemo } from '@/providers/ProductionDemoProvider';
function Notes(){const demo=useProductionDemo();return <div className="space-y-6"><h1 className="text-2xl font-bold">Notes & Creative Tasks</h1>{demo&&<DemoNotebook studentId={demo.studentId}/>}</div>;}
export function productionDemoRoutes(){return <Route path="/production/showcase" element={<ProductionDemoLayout/>}><Route index element={<Navigate to="instructor" replace/>}/><Route path="instructor" element={<ProductionInstructorDashboard/>}/><Route path="instructor/curriculum" element={<ProductionCurriculum/>}/><Route path="instructor/messages" element={<DemoMessages/>}/><Route path="student" element={<ProductionStudentDashboard/>}/><Route path="student/curriculum" element={<ProductionCurriculum/>}/><Route path="student/messages" element={<DemoMessages/>}/><Route path="student/notes" element={<Notes/>}/><Route path="student/classes" element={<ProductionStudentClasses/>}/></Route>;}