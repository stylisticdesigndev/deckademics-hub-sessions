import { supabase } from '@/integrations/supabase/client';
import { MAX_AUDIO_BYTES, audioUploadAllowed } from './productionLearning';
export async function uploadProductionFile(file:File,userId:string,submission=false) {
 if(file.size>MAX_AUDIO_BYTES)throw new Error('Files must be 25 MB or smaller.');
 if(submission&&!audioUploadAllowed(file.name,file.size))throw new Error('Choose an MP3 or WAV file, 25 MB or smaller.');
 if(!submission&&!/\.(mp3|wav|mp4|webm|pdf|txt|zip|docx|png|jpg|jpeg)$/i.test(file.name))throw new Error('Choose audio, video, a document, image, or ZIP file.');
 const path=`${submission?'submissions':'lessons'}/${userId}/${crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
 const r=await supabase.storage.from('production-media').upload(path,file);if(r.error)throw r.error;return path;
}