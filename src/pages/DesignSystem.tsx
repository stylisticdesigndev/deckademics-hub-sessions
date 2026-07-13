import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Palette, Type as TypeIcon, MousePointerClick, Tag, TextCursorInput,
  LayoutGrid, Bell, Table as TableIcon, Layers, Home, Calendar, CheckCircle,
  Users, TrendingUp, Music2,
} from 'lucide-react';

import { Logo } from '@/components/logo/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import { StatsCard } from '@/components/cards/StatsCard';
import { MilestoneChip } from '@/components/progress/MilestoneChip';
import { MilestoneSelector } from '@/components/progress/MilestoneSelector';
import { ProgressBar } from '@/components/progress/ProgressBar';
import { useToast } from '@/hooks/use-toast';

/* ------------------------------------------------------------------ */
/* Layout helpers                                                     */
/* ------------------------------------------------------------------ */

const Section = ({
  id, icon, title, description, children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-24">
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          {icon}
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
    </div>
    {children}
  </section>
);

const Subhead = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
    {children}
  </h3>
);

const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-border bg-card p-6 ${className}`}>{children}</div>
);

/* ------------------------------------------------------------------ */
/* Color data                                                          */
/* ------------------------------------------------------------------ */

const semanticColors = [
  { name: 'Background', cls: 'bg-background', token: '--background', border: true },
  { name: 'Foreground', cls: 'bg-foreground', token: '--foreground' },
  { name: 'Card', cls: 'bg-card', token: '--card', border: true },
  { name: 'Primary', cls: 'bg-primary', token: '--primary' },
  { name: 'Secondary', cls: 'bg-secondary', token: '--secondary' },
  { name: 'Accent', cls: 'bg-accent', token: '--accent' },
  { name: 'Muted', cls: 'bg-muted', token: '--muted' },
  { name: 'Destructive', cls: 'bg-destructive', token: '--destructive' },
  { name: 'Border', cls: 'bg-border', token: '--border' },
  { name: 'Ring', cls: 'bg-ring', token: '--ring' },
];

const brandColors = [
  { name: 'Primary Green', hex: '#40a647', cls: 'bg-deckademics-primary' },
  { name: 'Accent Green', hex: '#307834', cls: 'bg-deckademics-accent' },
  { name: 'Secondary Purple', hex: '#8B5CF6', cls: 'bg-deckademics-secondary' },
  { name: 'Dark', hex: '#212529', cls: 'bg-deckademics-dark' },
  { name: 'Darker', hex: '#191c20', cls: 'bg-deckademics-darker' },
  { name: 'Light', hex: '#F5F5F5', cls: 'bg-deckademics-light' },
];

const statusColors = [
  { name: 'Success / Present', cls: 'bg-green-500', label: 'green-500' },
  { name: 'Warning / Proficient', cls: 'bg-amber-500', label: 'amber-500' },
  { name: 'Error / Absent', cls: 'bg-red-500', label: 'red-500' },
];

const ColorSwatch = ({
  name, cls, token, hex, label, border,
}: {
  name: string; cls: string; token?: string; hex?: string; label?: string; border?: boolean;
}) => (
  <div className="rounded-lg border border-border bg-card p-3">
    <div className={`mb-3 h-16 w-full rounded-md ${cls} ${border ? 'border border-border' : ''}`} />
    <p className="text-sm font-medium">{name}</p>
    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{token ?? hex ?? label}</p>
  </div>
);

/* ------------------------------------------------------------------ */
/* Nav                                                                 */
/* ------------------------------------------------------------------ */

const NAV = [
  { id: 'foundations', label: 'Foundations' },
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'badges', label: 'Badges & Milestones' },
  { id: 'forms', label: 'Form Controls' },
  { id: 'cards', label: 'Cards & Stats' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'data', label: 'Data Display' },
  { id: 'overlays', label: 'Overlays' },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const DesignSystem = () => {
  const { toast } = useToast();
  const [milestone, setMilestone] = useState(2);
  const [sliderVal, setSliderVal] = useState([60]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex">Design System</Badge>
            <Button asChild variant="ghost" size="sm">
              <Link to="/"><Home className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Home</span></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-b from-primary/10 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Music2 className="h-3.5 w-3.5" /> Deckademics DJ Academy
          </div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Design System
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            A living catalogue of the tokens, typography, and components that make up the
            Deckademics platform — a dark-first, green-accented system built on Tailwind CSS,
            shadcn/ui and Radix primitives.
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-10 px-4 py-12">
        {/* Side nav */}
        <aside className="hidden w-48 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1 space-y-20">
          {/* Foundations */}
          <Section
            id="foundations"
            icon={<Layers className="h-5 w-5" />}
            title="Foundations"
            description="The atomic values everything else is composed from — spacing rhythm, corner radii and elevation."
          >
            <div className="grid gap-6 md:grid-cols-3">
              <Panel>
                <Subhead>Border Radius</Subhead>
                <div className="space-y-3">
                  {[
                    { name: 'sm', cls: 'rounded-sm' },
                    { name: 'md', cls: 'rounded-md' },
                    { name: 'lg (0.5rem)', cls: 'rounded-lg' },
                    { name: 'full', cls: 'rounded-full' },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center gap-3">
                      <div className={`h-10 w-10 bg-primary/20 border border-primary/40 ${r.cls}`} />
                      <span className="font-mono text-xs text-muted-foreground">{r.name}</span>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel>
                <Subhead>Spacing Scale</Subhead>
                <div className="space-y-2">
                  {[2, 4, 6, 8, 12].map((s) => (
                    <div key={s} className="flex items-center gap-3">
                      <div className="h-3 rounded bg-primary" style={{ width: s * 4 }} />
                      <span className="font-mono text-xs text-muted-foreground">gap-{s} ({s * 4}px)</span>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel>
                <Subhead>Elevation</Subhead>
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-card p-3 text-xs shadow-sm">shadow-sm</div>
                  <div className="rounded-lg border border-border bg-card p-3 text-xs shadow-md">shadow-md</div>
                  <div className="rounded-lg border border-border bg-card p-3 text-xs shadow-lg">shadow-lg</div>
                </div>
              </Panel>
            </div>
          </Section>

          {/* Colors */}
          <Section
            id="colors"
            icon={<Palette className="h-5 w-5" />}
            title="Colors"
            description="Semantic tokens drive theming across the app; brand and status colors add identity and meaning."
          >
            <Subhead>Semantic Tokens</Subhead>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {semanticColors.map((c) => <ColorSwatch key={c.name} {...c} />)}
            </div>
            <Subhead>Brand Palette</Subhead>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {brandColors.map((c) => <ColorSwatch key={c.name} {...c} />)}
            </div>
            <Subhead>Status Colors</Subhead>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {statusColors.map((c) => <ColorSwatch key={c.name} {...c} />)}
            </div>
          </Section>

          {/* Typography */}
          <Section
            id="typography"
            icon={<TypeIcon className="h-5 w-5" />}
            title="Typography"
            description="A single system sans-serif family carries the whole product, differentiated by weight and scale."
          >
            <Panel className="space-y-6">
              <div>
                <p className="mb-1 font-mono text-xs text-muted-foreground">text-4xl / font-bold</p>
                <p className="text-4xl font-bold">Drop the needle</p>
              </div>
              <Separator />
              <div>
                <p className="mb-1 font-mono text-xs text-muted-foreground">text-2xl / font-bold — page title</p>
                <p className="text-2xl font-bold">Student Dashboard</p>
              </div>
              <Separator />
              <div>
                <p className="mb-1 font-mono text-xs text-muted-foreground">text-lg / font-semibold — section</p>
                <p className="text-lg font-semibold">Upcoming Classes</p>
              </div>
              <Separator />
              <div>
                <p className="mb-1 font-mono text-xs text-muted-foreground">text-base — body</p>
                <p className="text-base">Track skills, attendance and progress across every classroom.</p>
              </div>
              <Separator />
              <div>
                <p className="mb-1 font-mono text-xs text-muted-foreground">text-sm / text-muted-foreground — supporting</p>
                <p className="text-sm text-muted-foreground">Your instructor will review these milestones weekly.</p>
              </div>
              <Separator />
              <div>
                <p className="mb-1 font-mono text-xs text-muted-foreground">text-xs / uppercase / tracking — label</p>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Proficiency</p>
              </div>
            </Panel>
          </Section>

          {/* Buttons */}
          <Section
            id="buttons"
            icon={<MousePointerClick className="h-5 w-5" />}
            title="Buttons"
            description="Six variants and four sizes cover every call-to-action, from primary submits to inline links."
          >
            <Panel className="space-y-8">
              <div>
                <Subhead>Variants</Subhead>
                <div className="flex flex-wrap gap-3">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>
              <div>
                <Subhead>Sizes</Subhead>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon" aria-label="icon"><Bell className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <Subhead>With Icons & States</Subhead>
                <div className="flex flex-wrap items-center gap-3">
                  <Button><CheckCircle className="h-4 w-4" /> Mark Present</Button>
                  <Button variant="outline"><Calendar className="h-4 w-4" /> Add to Calendar</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>
            </Panel>
          </Section>

          {/* Badges & Milestones */}
          <Section
            id="badges"
            icon={<Tag className="h-5 w-5" />}
            title="Badges & Milestones"
            description="Badges label status; the 3-point milestone system is the heart of the grading experience."
          >
            <div className="grid gap-6 md:grid-cols-2">
              <Panel>
                <Subhead>Badge Variants</Subhead>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Overdue</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </Panel>
              <Panel>
                <Subhead>Milestone Chips</Subhead>
                <div className="flex flex-wrap gap-2">
                  <MilestoneChip value={0} />
                  <MilestoneChip value={1} />
                  <MilestoneChip value={2} />
                  <MilestoneChip value={3} />
                </div>
              </Panel>
              <Panel className="md:col-span-2">
                <Subhead>Milestone Selector</Subhead>
                <div className="max-w-sm">
                  <MilestoneSelector value={milestone} onChange={setMilestone} />
                </div>
              </Panel>
            </div>
          </Section>

          {/* Forms */}
          <Section
            id="forms"
            icon={<TextCursorInput className="h-5 w-5" />}
            title="Form Controls"
            description="Consistent, accessible inputs used across auth, profile setup and admin management."
          >
            <div className="grid gap-6 md:grid-cols-2">
              <Panel className="space-y-4">
                <Subhead>Text Inputs</Subhead>
                <div className="space-y-2">
                  <Label htmlFor="ds-name">DJ Name</Label>
                  <Input id="ds-name" placeholder="DJ Deckademics" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ds-bio">Bio</Label>
                  <Textarea id="ds-bio" placeholder="Tell us about your sound..." />
                </div>
                <div className="space-y-2">
                  <Label>Classroom</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select a classroom" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Classroom 1</SelectItem>
                      <SelectItem value="2">Classroom 2</SelectItem>
                      <SelectItem value="3">Classroom 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Panel>
              <Panel className="space-y-6">
                <div>
                  <Subhead>Toggles</Subhead>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox id="ds-check" defaultChecked />
                      <Label htmlFor="ds-check">Email notifications</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch id="ds-switch" defaultChecked />
                      <Label htmlFor="ds-switch">SMS reminders</Label>
                    </div>
                  </div>
                </div>
                <div>
                  <Subhead>Radio Group</Subhead>
                  <RadioGroup defaultValue="novice" className="space-y-2">
                    {['novice', 'amateur', 'intermediate', 'advanced'].map((lvl) => (
                      <div key={lvl} className="flex items-center gap-3">
                        <RadioGroupItem value={lvl} id={`ds-${lvl}`} />
                        <Label htmlFor={`ds-${lvl}`} className="capitalize">{lvl}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Subhead>Slider — {sliderVal[0]}%</Subhead>
                  <Slider value={sliderVal} onValueChange={setSliderVal} max={100} step={1} />
                </div>
              </Panel>
            </div>
          </Section>

          {/* Cards & Stats */}
          <Section
            id="cards"
            icon={<LayoutGrid className="h-5 w-5" />}
            title="Cards & Stats"
            description="Content containers and the stat cards that headline every dashboard."
          >
            <Subhead>Stat Cards</Subhead>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatsCard title="Today's Classes" value="3" icon={<Calendar className="h-5 w-5" />} description="3 classes today" />
              <StatsCard title="Skills Mastered" value="72%" icon={<CheckCircle className="h-5 w-5" />} description="Across 24 students" />
              <StatsCard title="Total Students" value="24" icon={<Users className="h-5 w-5" />} description="24 students assigned" trend={{ value: 12, isPositive: true }} />
            </div>
            <Subhead>Base Card</Subhead>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>A short supporting description of the card.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Cards group related content and actions with a consistent border, radius and padding.
                  </p>
                </CardContent>
              </Card>
              <div className="dj-card">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-semibold">.dj-card utility</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  A branded card variant with a primary-colored hover border, used across dashboards.
                </p>
              </div>
            </div>
          </Section>

          {/* Feedback */}
          <Section
            id="feedback"
            icon={<Bell className="h-5 w-5" />}
            title="Feedback & Progress"
            description="Alerts, toasts, progress and loading states keep users informed at every step."
          >
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Alert>
                  <AlertTitle>Heads up</AlertTitle>
                  <AlertDescription>Your next class is tomorrow at 4:00 PM.</AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertTitle>Attendance overdue</AlertTitle>
                  <AlertDescription>Please log attendance for Classroom 2.</AlertDescription>
                </Alert>
              </div>
              <Panel className="space-y-5">
                <div>
                  <Subhead>Progress (shadcn)</Subhead>
                  <Progress value={64} />
                </div>
                <div>
                  <Subhead>ProgressBar (branded)</Subhead>
                  <ProgressBar value={18} max={24} label="Skills Mastered" />
                </div>
                <div>
                  <Subhead>Toast</Subhead>
                  <Button
                    variant="outline"
                    onClick={() => toast({ title: 'Saved', description: 'Milestone updated successfully.' })}
                  >
                    Trigger toast
                  </Button>
                </div>
                <div>
                  <Subhead>Skeleton (loading)</Subhead>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
          </Section>

          {/* Data display */}
          <Section
            id="data"
            icon={<TableIcon className="h-5 w-5" />}
            title="Data Display"
            description="Tables, tabs, accordions and avatars present structured records and identities."
          >
            <div className="space-y-6">
              <Panel>
                <Subhead>Table</Subhead>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Ava Mixon</TableCell>
                      <TableCell>Intermediate</TableCell>
                      <TableCell><Badge>Active</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Leo Turner</TableCell>
                      <TableCell>Novice</TableCell>
                      <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Panel>

              <div className="grid gap-6 md:grid-cols-2">
                <Panel>
                  <Subhead>Tabs</Subhead>
                  <Tabs defaultValue="active">
                    <TabsList>
                      <TabsTrigger value="active">Active</TabsTrigger>
                      <TabsTrigger value="pending">Pending</TabsTrigger>
                      <TabsTrigger value="inactive">Inactive</TabsTrigger>
                    </TabsList>
                    <TabsContent value="active" className="pt-3 text-sm text-muted-foreground">Active students appear here.</TabsContent>
                    <TabsContent value="pending" className="pt-3 text-sm text-muted-foreground">Awaiting approval.</TabsContent>
                    <TabsContent value="inactive" className="pt-3 text-sm text-muted-foreground">Deactivated accounts.</TabsContent>
                  </Tabs>
                </Panel>
                <Panel>
                  <Subhead>Avatars</Subhead>
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarFallback>AM</AvatarFallback></Avatar>
                    <Avatar><AvatarFallback className="bg-primary/20 text-primary">LT</AvatarFallback></Avatar>
                    <Avatar><AvatarFallback className="bg-secondary/20 text-secondary">DJ</AvatarFallback></Avatar>
                  </div>
                </Panel>
              </div>

              <Panel>
                <Subhead>Accordion</Subhead>
                <Accordion type="single" collapsible>
                  <AccordionItem value="q1">
                    <AccordionTrigger>How is proficiency calculated?</AccordionTrigger>
                    <AccordionContent>Each skill is scored on a 3-point milestone scale and averaged.</AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="q2">
                    <AccordionTrigger>When can a student advance?</AccordionTrigger>
                    <AccordionContent>When every core skill is Mastered and creative skills are at least Proficient.</AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Panel>
            </div>
          </Section>

          {/* Overlays */}
          <Section
            id="overlays"
            icon={<Layers className="h-5 w-5" />}
            title="Overlays"
            description="Dialogs and tooltips layer contextual actions and hints above the page."
          >
            <Panel className="flex flex-wrap gap-3">
              <Dialog>
                <DialogTrigger asChild><Button>Open Dialog</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm advancement</DialogTitle>
                    <DialogDescription>
                      Move this student up to the next proficiency level?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Advance</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Tooltip>
                <TooltipTrigger asChild><Button variant="outline">Hover for tooltip</Button></TooltipTrigger>
                <TooltipContent>Tooltips explain icons and truncated content.</TooltipContent>
              </Tooltip>
            </Panel>
          </Section>
        </main>
      </div>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted-foreground">
          Deckademics Design System · Built with React, Tailwind CSS & shadcn/ui
        </div>
      </footer>
    </div>
  );
};

export default DesignSystem;