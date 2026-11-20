import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, MessageSquare, StickyNote, CalendarDays } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useProgram } from '@/hooks/useProgram';
import { Button } from '@/components/ui/button';
export function ProductionStudentNavigation(){
 const {pathname}=useLocation();const {isMobile,state,setOpenMobile}=useSidebar();const {canSwitch}=useProgram();
 if(!isMobile&&state==='collapsed')return null;
 return <nav className="space-y-2">{[{title:'Dashboard',href:'/student/production',icon:LayoutDashboard},{title:'Curriculum',href:'/student/production/curriculum',icon:BookOpen},{title:'Classes',href:'/student/production/classes',icon:CalendarDays},{title:'Notes',href:'/student/production/notes',icon:StickyNote},{title:'Messages',href:'/student/production/messages',icon:MessageSquare}].map(item=><Button key={item.href} asChild variant={pathname===item.href?'default':'ghost'} className="w-full justify-start"><Link to={item.href} onClick={()=>setOpenMobile(false)}><item.icon/>{item.title}</Link></Button>)}{canSwitch&&<Button asChild variant="outline" className="w-full"><Link to="/student/dashboard">DJ Dashboard</Link></Button>}</nav>;
}