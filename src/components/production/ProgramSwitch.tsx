import { Disc3, AudioLines } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProgram } from '@/hooks/useProgram';
export function ProgramSwitch() {
  const { program, setProgram, canSwitch } = useProgram();
  if (!canSwitch) return null;
  return <Tabs value={program} onValueChange={value => setProgram(value === 'production' ? 'production' : 'dj')}>
    <TabsList className="grid w-full grid-cols-2 sm:w-80 h-11">
      <TabsTrigger value="dj" className="gap-2"><Disc3 className="h-4 w-4" />DJ</TabsTrigger>
      <TabsTrigger value="production" className="gap-2"><AudioLines className="h-4 w-4" />Production</TabsTrigger>
    </TabsList>
  </Tabs>;
}