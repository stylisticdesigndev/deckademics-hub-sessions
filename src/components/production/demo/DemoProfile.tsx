import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Camera, GraduationCap, Pencil, Save } from 'lucide-react';
import { useProductionDemo } from '@/providers/ProductionDemoProvider';
import { DEMO_INSTRUCTOR_ID, getDemoProfile, type DemoProfile as Profile } from '@/lib/productionDemoState';
import { productionLevelLabel } from '@/lib/production';
import { formatDateUS } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProducerIdentity } from '../ProducerIdentity';

export function DemoProfile() {
  const demo = useProductionDemo();
  if (!demo) return null;
  const id = demo.role === 'instructor' ? DEMO_INSTRUCTOR_ID : demo.studentId;
  return <ProfilePage key={id} id={id} />;
}

function ProfilePage({ id }: { id: string }) {
  const demo = useProductionDemo();
  const initial = demo ? getDemoProfile(demo.state, id) : null;
  const [form, setForm] = useState<Profile | null>(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mentorOpen, setMentorOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  if (!demo || !form) return null;
  const instructor = demo.role === 'instructor';
  const profile = getDemoProfile(demo.state, id);
  const mentor = getDemoProfile(demo.state, DEMO_INSTRUCTOR_ID);
  const enrollment = demo.state.enrollments.find(e => e.student_id === id);
  const intake = demo.state.intakes.find(i => i.enrollment_id === enrollment?.id);
  const name = `${profile.firstName} ${profile.lastName}`.trim();
  const displayName = instructor ? profile.stageName || name : name;
  const initials = `${profile.firstName[0] || ''}${profile.lastName[0] || ''}`.toUpperCase();
  const set = (field: keyof Profile, value: string) => setForm(old => old ? { ...old, [field]: value } : old);
  const fields: { key: keyof Profile; label: string; type?: string; required?: boolean; readOnly?: boolean }[] = [
    { key: 'firstName', label: 'First Name', required: true },
    { key: 'lastName', label: 'Last Name' },
    { key: 'stageName', label: instructor ? 'Stage Name' : 'Producer Name' },
    { key: 'email', label: 'Email', type: 'email', readOnly: true },
    { key: 'phone', label: 'Phone Number', type: 'tel' },
    { key: 'pronouns', label: 'Pronouns' },
  ];
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setError('');
    try { await demo.save({ kind: 'profile', id, value: { ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim() } }); setEditing(false); }
    catch { setError('Your changes could not be saved. Please try again.'); }
    finally { setSaving(false); }
  };
  const uploadPhoto = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Choose an image for your profile photo.'); return; }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 512 / Math.max(image.width, image.height));
      canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext('2d'); if (!context) throw new Error('Image unavailable');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const avatarUrl = canvas.toDataURL('image/jpeg', 0.8);
      await demo.save({ kind: 'profile', id, value: { ...profile, avatarUrl } });
      setForm(old => old ? { ...old, avatarUrl } : old); setError('');
    } catch { setError('This photo could not be opened. Please choose another image.'); }
    finally { URL.revokeObjectURL(url); }
  };
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold">{instructor ? 'Instructor Profile' : 'Profile'}</h1><p className="text-muted-foreground mt-1">{instructor ? 'Personal information & teaching schedule' : 'Personal information & enrollment'}</p></header>
    <section className="flex flex-wrap items-center gap-4 border-b pb-6">
      <div className="relative shrink-0">
        <Avatar className="h-20 w-20"><AvatarImage src={profile.avatarUrl} alt={displayName} /><AvatarFallback className="text-xl">{initials}</AvatarFallback></Avatar>
        <Button size="icon" variant="outline" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full" aria-label="Change profile photo" onClick={() => fileInput.current?.click()}><Camera className="h-4 w-4" /></Button>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) void uploadPhoto(file); e.target.value = ''; }} />
      </div>
      <div className="min-w-0 flex-1"><h2 className="text-xl font-semibold break-words">{displayName}</h2><p className="text-sm text-muted-foreground break-all">{profile.email}</p><Badge variant="outline" className="mt-2">{instructor ? 'Music Production · Lead Instructor' : productionLevelLabel(enrollment?.level || 'novice')}</Badge></div>
      {!editing && <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setForm(profile); setEditing(true); }}><Pencil className="h-4 w-4" />Edit Profile</Button>}
    </section>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={submit} className="space-y-5 lg:col-span-2 min-w-0">
        <h2 className="text-lg font-semibold">Personal Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">{fields.map(field => <div key={field.key} className="space-y-2 min-w-0"><Label htmlFor={`profile-${field.key}`}>{field.label}</Label><Input id={`profile-${field.key}`} type={field.type || 'text'} value={form[field.key]} required={field.required} disabled={!editing || field.readOnly} onChange={e => set(field.key, e.target.value)} /></div>)}</div>
        <div className="space-y-2"><Label htmlFor="profile-bio">Bio</Label><Textarea id="profile-bio" rows={4} value={form.bio} disabled={!editing} onChange={e => set('bio', e.target.value)} /></div>
        {instructor && <div className="space-y-2"><Label htmlFor="profile-expertise">Areas of Expertise</Label><Input id="profile-expertise" value={form.expertise} disabled={!editing} onChange={e => set('expertise', e.target.value)} /></div>}
        {editing && <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => { setForm(profile); setEditing(false); setError(''); }}>Cancel</Button><Button type="submit" disabled={saving}><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save Changes'}</Button></div>}
      </form>
      <section className="space-y-5 min-w-0 border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
        <h2 className="text-lg font-semibold">{instructor ? 'Teaching Schedule' : 'Enrollment Details'}</h2>
        {instructor ? <div className="space-y-4">{demo.state.enrollments.filter(e => e.active && e.instructor_id === id).sort((a, b) => new Date(`2000-01-01 ${a.class_time}`).getTime() - new Date(`2000-01-01 ${b.class_time}`).getTime()).map(e => <div key={e.id} className="flex gap-3"><CalendarDays className="h-4 w-4 mt-1 text-muted-foreground shrink-0" /><div><p className="text-sm font-medium capitalize">{e.class_day} · {e.class_time}</p><p className="text-sm text-muted-foreground">{demo.state.students.find(s => s.id === e.student_id)?.name} · {productionLevelLabel(e.level)}</p></div></div>)}</div> : <>
          <dl className="grid grid-cols-2 gap-4 text-sm">{[['Level', productionLevelLabel(enrollment?.level || 'novice')], ['Status', enrollment?.active ? 'Active' : 'Inactive'], ['Class Day', enrollment?.class_day || 'Not assigned'], ['Class Time', enrollment?.class_time || 'Not assigned'], ['Start Date', enrollment?.created_at ? formatDateUS(enrollment.created_at) : 'Not set'], ['Program', 'Music Production']].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-medium capitalize mt-1 break-words">{value}</dd></div>)}</dl>
          <div className="border-t pt-4"><p className="text-xs text-muted-foreground mb-2">Instructor</p><Button variant="ghost" className="h-auto w-full justify-start whitespace-normal px-0" onClick={() => setMentorOpen(true)}><GraduationCap className="h-5 w-5 shrink-0" /><span className="flex-1 text-left">{mentor.stageName || mentor.firstName}</span><ArrowUpRight className="h-4 w-4 shrink-0" /></Button></div>
          <Button asChild variant="outline" className="w-full"><Link to="/production/showcase/student/messages">Message Instructor<ArrowUpRight className="h-4 w-4" /></Link></Button>
        </>}
      </section>
    </div>
    {!instructor && intake && <section className="border-t pt-6 space-y-3"><h2 className="text-lg font-semibold">Producer Identity</h2><ProducerIdentity daw={intake.daw} hardware={intake.hardware} genres={intake.genres} goals={intake.goals} experience={intake.experience} /></section>}
    <Dialog open={mentorOpen} onOpenChange={setMentorOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{mentor.stageName || mentor.firstName}</DialogTitle><DialogDescription>Music Production · Lead Instructor</DialogDescription></DialogHeader><div className="space-y-4"><Avatar className="h-16 w-16"><AvatarImage src={mentor.avatarUrl} alt={mentor.stageName} /><AvatarFallback>{mentor.firstName[0]}</AvatarFallback></Avatar><p className="text-sm whitespace-pre-wrap break-words">{mentor.bio}</p><div className="flex flex-wrap gap-2">{mentor.expertise.split(',').filter(Boolean).map(s => <Badge key={s} variant="outline">{s.trim()}</Badge>)}</div></div></DialogContent></Dialog>
  </div>;
}