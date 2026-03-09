# WBC 2026 Live RD · auto-sync backend

## Qué agrega esta versión
- backend de sincronización automática
- script para traer juegos desde TheSportsDB
- cálculo automático de standings por pool a partir de juegos finalizados
- workflow de GitHub Actions cada 5 minutos
- adaptador base para Sportradar si más adelante compras acceso oficial

## Pasos mínimos
1. Ejecuta `auto-sync/create_tables_auto.sql` en Supabase.
2. En GitHub, crea estos Secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SPORTSDB_API_BASE` = `https://www.thesportsdb.com/api/v1/json/1`
   - `WBC_LEAGUE_ID` = `5755`
3. Sube este proyecto a un repo.
4. Activa GitHub Actions.
5. El workflow `Sync WBC data` actualizará Supabase cada 5 minutos.

## Qué se actualiza solo
- juegos y marcadores
- calendario
- ticker
- standings calculados
- juego destacado

## Qué sigue siendo mejor con proveedor oficial o panel admin
- líderes ofensivos
- líderes de pitcheo
- noticias automáticas
- push realmente inmediatas

## Nota
La versión con proveedor gratuito es la mejor ruta sin contratar una API comercial.
Si quieres precisión más alta y cobertura oficial del WBC 2026, cambia al adaptador de Sportradar.
