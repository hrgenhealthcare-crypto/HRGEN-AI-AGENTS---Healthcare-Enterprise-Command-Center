#!/usr/bin/env node
// Readable HRGen client core operational backup / verify tool. Backups contain personal data.
import { DatabaseSync, backup } from 'node:sqlite';
import { readdirSync, readFileSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

const die=(s)=>{console.error(s);process.exitCode=1;};
const sha=(s)=>createHash('sha256').update(readFileSync(s)).digest('hex');
const validate=(s)=>{const db=new DatabaseSync(s,{readOnly:true});try{const r=db.prepare('PRAGMA quick_check').all();if(r.length!==1||r[0].quick_check!=='ok')throw Error('SQLite quick_check failed: '+basename(s));return {bytes:statSync(s).size,sha256:sha(s)};}finally{db.close();}};

async function main(){
  const [mode,input,output]=process.argv.slice(2);
  if(mode==='verify'){
    const dir=resolve(input||'.'),manifest=JSON.parse(readFileSync(join(dir,'manifest.json'),'utf8'));
    if(manifest.format!=='hrgen-sqlite-backup-v1'||!Array.isArray(manifest.files))throw Error('Invalid backup manifest');
    for(const entry of manifest.files){
      if(!/^(platform|tenant-[a-f0-9-]+)\.sqlite$/.test(entry.name))throw Error('Invalid backup filename');
      const actual=validate(join(dir,entry.name));
      if(actual.sha256!==entry.sha256||actual.bytes!==entry.bytes)throw Error('Backup checksum mismatch: '+entry.name);
    }
    console.log(JSON.stringify({ok:true,mode:'verify',files:manifest.files.length,createdAt:manifest.createdAt}));return;
  }
  if(mode!=='backup'||!input||!output)throw Error('Usage: node scripts/core-backup.mjs backup <persistent-core-dir> <empty-backup-dir> | verify <backup-dir>');
  const source=resolve(input),dir=resolve(output);
  if(dir===source||dir.startsWith(source+'/'))throw Error('Backup directory must be outside live core storage');
  if(statSync(source).isDirectory()!==true)throw Error('Not a directory');
  mkdirSync(dir,{recursive:true,mode:0o700});
  if(readdirSync(dir).length!==0)throw Error('Backup directory must be empty');
  const registry=join(source,'platform.sqlite');
  const tenantsDir=join(source,'tenants');
  const files=[{source:registry,name:'platform.sqlite'}];
  for(const f of readdirSync(tenantsDir).filter(s=>/^[a-f0-9-]{36}\.sqlite$/.test(s)).sort())files.push({source:join(tenantsDir,f),name:'tenant-'+f});
  const manifest={format:'hrgen-sqlite-backup-v1',createdAt:new Date().toISOString(),consistentAcrossDatabases:false,notice:'Take under maintenance/paused writes; encrypted offsite storage required for personal data.',id:randomUUID(),files:[]};
  for(const entry of files){
    const db=new DatabaseSync(entry.source,{readOnly:true});
    try{await backup(db,join(dir,entry.name));}finally{db.close();}
    const check=validate(join(dir,entry.name));
    manifest.files.push({name:entry.name,...check});
  }
  writeFileSync(join(dir,'manifest.json'),JSON.stringify(manifest,null,2),{mode:0o600,flag:'wx'});
  console.log(JSON.stringify({ok:true,mode:'backup',files:manifest.files.length,path:dir,note:'Backup must be encrypted and restoration-tested'}));
}
main().catch(e=>die('HRGEN_BACKUP_ERROR: '+e.message));
