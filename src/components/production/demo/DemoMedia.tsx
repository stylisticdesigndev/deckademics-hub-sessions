import { useEffect, useState } from 'react';
import { FileDown } from 'lucide-react';
import { resolveDemoFile } from '@/lib/productionDemoMedia';
import { safeMediaUrl } from '@/lib/productionLearning';
import { TrackPlayer } from '../TrackPlayer';

let grooveUrl = '';
function referenceGroove() {
  if (grooveUrl) return grooveUrl;
  const rate = 22050; const duration = 16; const samples = rate * duration;
  const buffer = new ArrayBuffer(44 + samples * 2); const view = new DataView(buffer);
  const text = (offset: number, value: string) => [...value].forEach((c, i) => view.setUint8(offset+i, c.charCodeAt(0)));
  text(0,'RIFF'); view.setUint32(4,36+samples*2,true); text(8,'WAVE'); text(12,'fmt '); view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true); view.setUint32(24,rate,true); view.setUint32(28,rate*2,true); view.setUint16(32,2,true); view.setUint16(34,16,true); text(36,'data'); view.setUint32(40,samples*2,true);
  for(let i=0;i<samples;i++){ const t=i/rate;const beat=t%(60/90);const off=(t+30/90)%(60/90);const kick=Math.sin(2*Math.PI*(52*beat+18*(1-Math.exp(-beat*20))))*Math.exp(-beat*22);const hat=(Math.sin(i*13.31)+Math.sin(i*7.73))*Math.exp(-(t%(30/90))*80)*0.08;const snare=Math.sin(i*4.12)*Math.exp(-off*35)*0.2;const bass=Math.sin(2*Math.PI*[65.4,65.4,77.8,58.3][Math.floor(t/(120/90))%4]*t)*Math.exp(-beat*3)*0.16;view.setInt16(44+i*2,Math.max(-1,Math.min(1,(kick*.45+hat+snare+bass)))*22000,true); }
  grooveUrl=URL.createObjectURL(new Blob([buffer],{type:'audio/wav'}));return grooveUrl;
}
export function DemoMedia({type,url='',path,filename}:{type:string;url?:string;path?:string|null;filename?:string}) {
  const [source,setSource]=useState('');
  useEffect(()=>{let active=true;let object='';if(path?.startsWith('demo-file:')){void resolveDemoFile(path).then(value=>{object=value;if(active)setSource(value);});}else if(url.startsWith('https://demo.invalid/'))setSource(referenceGroove());else setSource(safeMediaUrl(url));return()=>{active=false;if(object)URL.revokeObjectURL(object);};},[path,url]);
  if(type==='file')return <a href={path?source:'data:text/plain;charset=utf-8,Deckademics%20Session%20Guide%0A%0A1.%20Listen%20to%20the%20reference.%0A2.%20Build%20a%20four-bar%20groove.%0A3.%20Export%20an%20MP3%20or%20WAV.%0A4.%20Write%20one%20question%20for%20your%20mentor.'} download={path?filename:'Session guide.txt'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary underline"><FileDown className="h-4 w-4"/>{filename||'Session guide'}</a>;
  if(url.includes('demo.invalid')&&type==='video')return <TrackPlayer source={source} title={filename || 'Reference groove'} />;
  if(source&&(path||/\.(wav|mp3)(\?|$)/i.test(url)||url.includes('demo.invalid')))return type==='video'?<video controls src={source} className="w-full aspect-video bg-muted"/>:<TrackPlayer source={source} title={filename || 'Audio bounce'} />;
  if(url){let embed='';try{const u=new URL(url);if(['soundcloud.com','www.soundcloud.com'].includes(u.hostname))embed=`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}`;if(u.hostname==='youtu.be')embed=`https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;if(['youtube.com','www.youtube.com'].includes(u.hostname))embed=`https://www.youtube-nocookie.com/embed/${u.searchParams.get('v')}`;}catch{}if(embed)return <iframe src={embed} title={filename||'Lesson media'} className="w-full aspect-video border-0"/>;return <a href={safeMediaUrl(url)} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{filename||'Open source'}</a>;}
  return <p className="text-muted-foreground text-sm">{path?'Sample file unavailable on this device.':'Add a media source'}</p>;
}