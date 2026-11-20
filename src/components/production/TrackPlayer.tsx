import { useEffect, useRef, useState } from 'react';
import { AudioLines, Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const timeLabel = (value: number) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;

export function TrackPlayer({ source, title = 'Audio bounce' }: { source: string; title?: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState(false);
  const [wave, setWave] = useState<number[]>([]);
  useEffect(() => {
    setPlaying(false); setPosition(0); setDuration(0); setError(false); setWave([]);
    const controller = new AbortController();
    let active = true;
    let context: AudioContext | undefined;
    // This is the real audio envelope, not a decorative placeholder waveform.
    void fetch(source, { signal: controller.signal }).then(r => {
      if (!r.ok) throw new Error('Audio unavailable');
      return r.arrayBuffer();
    }).then(async buffer => {
      if (!active) return;
      context = new AudioContext();
      const decoded = await context.decodeAudioData(buffer);
      const data = decoded.getChannelData(0);
      const size = Math.max(1, Math.floor(data.length / 96));
      const peaks = Array.from({ length: 96 }, (_, i) => {
        let peak = 0;
        for (let j = i * size; j < Math.min(data.length, (i + 1) * size); j++) peak = Math.max(peak, Math.abs(data[j]));
        return peak;
      });
      const max = Math.max(...peaks, 0.01);
      if (active) setWave(peaks.map(p => Math.max(2, p / max * 54)));
    }).catch(() => { /* Cross-origin sources can still play without a waveform. */ }).finally(() => { void context?.close(); });
    return () => { active = false; controller.abort(); };
  }, [source]);
  const seek = (value: number) => { if (audio.current) { audio.current.currentTime = value; setPosition(value); } };
  const toggle = async () => {
    if (!audio.current) return;
    if (playing) audio.current.pause();
    else { try { await audio.current.play(); } catch { setError(true); } }
  };
  return <div className="rounded-md border bg-muted/20 p-4 space-y-3 min-w-0">
    <audio ref={audio} src={source} preload="metadata" onLoadedMetadata={e => { const value = e.currentTarget.duration; setDuration(Number.isFinite(value) ? value : 0); }} onTimeUpdate={e => setPosition(e.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setError(true)} />
    <div className="flex items-center gap-3"><Button size="icon" className="shrink-0 rounded-full" aria-label={playing ? `Pause ${title}` : `Play ${title}`} disabled={error} onClick={() => void toggle()}>{playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</Button><div className="min-w-0 flex-1"><p className="text-sm font-semibold break-words">{title}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><AudioLines className="h-3 w-3" />{error ? 'Audio unavailable' : 'Audio'}</p></div><span className="text-xs tabular-nums text-muted-foreground shrink-0">{timeLabel(duration)}</span></div>
    {wave.length > 0 && <svg aria-hidden="true" viewBox="0 0 384 60" preserveAspectRatio="none" className="w-full h-14 text-primary">{wave.map((height, i) => <rect key={i} x={i * 4} y={(60 - height) / 2} width="2.5" height={height} rx="1" fill="currentColor" opacity={i / wave.length <= position / (duration || 1) ? 1 : 0.25} />)}</svg>}
    <Slider className="[&>span:first-child]:bg-muted" aria-label={`Seek ${title}`} value={[position]} min={0} max={duration || 1} step={0.1} disabled={!duration} onValueChange={([value]) => seek(value)} />
    <div className="flex items-center justify-between gap-2"><span className="text-xs tabular-nums text-muted-foreground">{timeLabel(position)} / {timeLabel(duration)}</span><div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Rewind 10 seconds" title="Rewind 10 seconds" onClick={() => seek(Math.max(0, position - 10))}><RotateCcw className="h-4 w-4" /></Button><Button variant="ghost" size="sm" className="h-8 w-12 tabular-nums" aria-label="Playback speed" onClick={() => { const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1; setRate(next); if (audio.current) audio.current.playbackRate = next; }}>{rate}×</Button><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={muted ? 'Unmute audio' : 'Mute audio'} title={muted ? 'Unmute' : 'Mute'} onClick={() => { setMuted(!muted); if (audio.current) audio.current.muted = !muted; }}>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</Button></div></div>
    {error && <a href={source} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">Open audio source</a>}
  </div>;
}