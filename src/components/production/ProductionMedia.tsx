import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProductionDemo } from '@/providers/ProductionDemoProvider';
import { DemoMedia } from './demo/DemoMedia';
import { safeMediaUrl } from '@/lib/productionLearning';
import { FileDown, ExternalLink } from 'lucide-react';
export function ProductionMedia({type,url='',path,filename}:{type:string;url?:string;path?:string|null;filename?:string}) {
 const demo = useProductionDemo();
 const {data:signed}=useQuery({queryKey:['production-media',path],enabled:!!path && !demo,staleTime:45*60*1000,queryFn:async()=>{if(!path)return '';const r=await supabase.storage.from('production-media').createSignedUrl(path,3600);if(r.error)throw r.error;return r.data.signedUrl;}});
 if(demo)return <DemoMedia type={type} url={url} path={path} filename={filename}/>;
 const source=path?signed:safeMediaUrl(url); if(!source)return <p className="text-sm text-muted-foreground">{path?'Loading media…':'Add a media source'}</p>;
 let embed=''; try { const u=new URL(source); if(u.hostname==='youtu.be')embed=`https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`; if(['www.youtube.com','youtube.com'].includes(u.hostname)&&u.searchParams.get('v'))embed=`https://www.youtube-nocookie.com/embed/${u.searchParams.get('v')}`; if(u.hostname==='vimeo.com'&&/^\/\d+$/.test(u.pathname))embed=`https://player.vimeo.com/video${u.pathname}`; if(['soundcloud.com','www.soundcloud.com'].includes(u.hostname))embed=`https://w.soundcloud.com/player/?url=${encodeURIComponent(source)}`; }catch{}
 if(embed)return <iframe title={filename||'Lesson media'} src={embed} className={type==='audio'?'w-full h-40 border-0':'w-full aspect-video border-0'} allow="fullscreen" loading="lazy" />;
 if(type==='audio'&&(path||/\.(mp3|wav)(\?|$)/i.test(source)))return <audio controls preload="metadata" src={source} className="w-full" />;
 if(type==='video'&&(path||/\.(mp4|webm)(\?|$)/i.test(source)))return <video controls preload="metadata" src={source} className="w-full aspect-video bg-muted rounded-md" />;
 return <a className="text-primary underline inline-flex items-center gap-2 break-all" href={source} target="_blank" rel="noopener noreferrer">{type==='file'?<FileDown className="h-4 w-4 shrink-0"/>:<ExternalLink className="h-4 w-4 shrink-0"/>}{filename||'Open source'}</a>;
}