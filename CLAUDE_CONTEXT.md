# Contexto para Claude / desarrollo futuro de Petricor

## 1. Resumen del proyecto
Petricor es una app social tipo red social construida con:
- Next.js 16 (App Router)
- React 19
- TypeScript
- Supabase (auth + storage + DB)
- Tailwind CSS
- Zustand, TanStack Query

La app ya implementa flujos de autenticación, feed, publicaciones, historias, mensajes, notificaciones, perfiles, reportes, bloqueo y panel de administración básico.

## 2. Estructura general del proyecto
Puntos importantes del árbol actual:
- [src/app](src/app): vistas principales, rutas y páginas
- [src/components](src/components): componentes reutilizables (likes, botones, badges, modal de reportes, etc.)
- [src/lib/supabase](src/lib/supabase): clientes de Supabase para navegador y servidor
- [src/app/api/posts/route.ts](src/app/api/posts/route.ts): API interna para paginación del feed
- [src/components/stories](src/components/stories): editor de historias, cámara, stickers, visor

## 3. Estado actual detectado
### Lo que ya existe bien
- Separación entre cliente y servidor para Supabase
- Uso de rutas protegidas y redirects básicos
- Feed con paginación por scroll
- Integración con historias, mensajes y reportes
- Estructura modular bastante clara para una app social

### Riesgos y deuda técnica visibles
- Hay muchos usos de `any` en componentes y páginas
- Se usan muchos `<img>` en vez de `next/image`
- Hay lógica de negocio mezclada en páginas y componentes
- Algunas operaciones de carga de datos son costosas y no están optimizadas
- Falta una capa de validación/normalización más fuerte para inputs y uploads
- No hay una estrategia clara de caché, revalidación y límites de carga aún consolidada

## 4. Prioridades recomendadas

### A. Seguridad
1. Reforzar políticas de RLS en Supabase
   - Asegurar que cada tabla tenga políticas estrictas por usuario
   - Evitar que un usuario pueda leer o modificar datos ajenos
   - Proteger `posts`, `comments`, `messages`, `stories`, `reports`, `follows`, `blocks`, `notifications`

2. Centralizar autenticación y permisos
   - Crear un helper/server utility para validar sesión y roles (`isAdmin`, `isOwner`, etc.)
   - No depender solo de la UI para proteger acciones

3. Validación de inputs y uploads
   - Usar Zod o Valibot para validar payloads en formularios y API routes
   - Limitar tamaño y tipo de archivos en uploads
   - Sanitizar contenido de texto antes de guardar
   - Evitar que se guarden URLs o datos maliciosos sin control

4. Protección frente a abuso
   - Rate limiting para crear posts, comentarios, mensajes y reportes
   - Detectar spam y contenido repetido
   - Limitar reintentos de login y subida de archivos

5. Seguridad de archivos/media
   - Usar URLs firmadas o storage policies estrictas
   - No exponer rutas de storage de manera libre si no es necesario
   - Añadir control de MIME y tamaños máximos por tipo de archivo

### B. Rendimiento y optimización
1. Optimizar imágenes y medios
   - Sustituir `<img>` por `next/image` donde sea viable
   - Añadir `sizes`, `priority`, `loading`, `placeholder` y configuración de loader
   - Generar thumbnails para imágenes grandes

2. Reducir consultas pesadas
   - Evitar `select('*')` innecesarios
   - Traer solo columnas requeridas por vista
   - Usar `count` solo cuando se necesita
   - Evitar N+1 queries donde sea posible

3. Mejorar paginación y carga incremental
   - Implementar cursor-based pagination en vez de depender solo de `range` cuando el volumen crezca
   - Usar `useInfiniteQuery` o un patrón similar para feed, mensajes y explorar

4. Cacheo y revalidación
   - Configurar `revalidate`/`cache` para páginas de lectura que no cambian constantemente
   - Usar ISR o dynamic behavior claro según cada ruta
   - Evitar `force-dynamic` en exceso si no es necesario

5. Carga diferida de componentes pesados
   - Lazy load para editor de historias, modal de cámara, visor de video, etc.
   - Dividir componentes grandes por funcionalidad

### C. Funcionalidades a implementar o mejorar
1. Autenticación y cuenta
   - Recuperación de contraseña
   - Verificación de email
   - MFA opcional
   - Sesiones activas / cierre de sesión remoto
   - Gestión de privacidad de cuenta

2. Feed y publicaciones
   - Filtros por tipo de contenido, seguidores, relevancia, fecha
   - Mejor sistema de comentarios con respuestas anidadas y edición en tiempo real
   - Reacciones más ricas (me gusta, wow, etc.)
   - Borrado suave y restauración de publicaciones

3. Mensajería
   - Indicadores de escritura
   - Read receipts
   - Soporte para multimedia más avanzada
   - Búsqueda dentro de conversaciones
   - Respuestas a mensajes específicos

4. Perfiles y redes sociales
   - Portadas de perfil
   - Bio más rica con links y etiquetas
   - Seguimiento de sugerencias inteligentes
   - Perfil privado y listas cerradas

5. Historias
   - Vista completa de historias con progreso visual mejorado
   - Respuestas y reacciones a historias
   - Publicación programada o desde cámara directa
   - Mejor gestión de expiración y limpieza

6. Moderación y administración
   - Cola de moderación con acciones rápidas
   - Dashboard de métricas básicas
   - Historial de acciones de moderación
   - Bloqueo de palabras o contenido sospechoso

### D. Vistas y UX
1. Mejorar estados vacíos y carga
   - Skeletons para feed, perfil, mensajes, notificaciones y panel admin
   - Estados de error más claros y recuperables

2. Accesibilidad
   - Mejorar contraste, focus states, labels y navegación por teclado
   - Añadir ARIA en modales, formularios y componentes interactivos

3. Diseño responsive y móvil-first
   - Ajustar componentes de historias y editor para pantallas pequeñas
   - Mejorar navegación inferior y modales en mobile

4. Consistencia visual
   - Unificar componentes de botones, inputs, cards y modales
   - Crear diseño system básico para reutilizar estilos

### E. Calidad de código y mantenimiento
1. Tipado fuerte
   - Eliminar `any` progresivamente
   - Definir interfaces compartidas para `Post`, `Comment`, `Profile`, `Story`, `Notification`

2. Componentes más limpios
   - Separar lógica de negocio de presentación
   - Extraer hooks para datos y formularios

3. Testing
   - Añadir tests unitarios para helpers y componentes críticos
   - Añadir tests de integración para login, publicación y reportes básicos

## 5. Plan recomendado de implementación
Prioridad 1:
- Tipado fuerte y limpieza de lint
- Revisión de políticas de seguridad en Supabase
- Reducción de `<img>` y mejora de imágenes

Prioridad 2:
- Optimización del feed y de la paginación
- Mejor manejo de estado y errores
- Mejoras de UX con skeletons y estados vacíos

Prioridad 3:
- Funcionalidades de autenticación avanzada y moderación
- Mejoras para mensajes y perfiles
- Panel admin más completo

## 6. Archivos clave para revisar primero
- [src/lib/supabase/server.ts](src/lib/supabase/server.ts)
- [src/lib/supabase/client.ts](src/lib/supabase/client.ts)
- [src/app/(main)/feed/page.tsx](src/app/(main)/feed/page.tsx)
- [src/app/(main)/feed/FeedList.tsx](src/app/(main)/feed/FeedList.tsx)
- [src/app/(main)/feed/NuevoPost.tsx](src/app/(main)/feed/NuevoPost.tsx)
- [src/components/stories/NuevaHistoria.tsx](src/components/stories/NuevaHistoria.tsx)
- [src/app/(main)/perfil/page.tsx](src/app/(main)/perfil/page.tsx)
- [src/app/(main)/admin/reportes/page.tsx](src/app/(main)/admin/reportes/page.tsx)
- [src/app/api/posts/route.ts](src/app/api/posts/route.ts)
- [src/proxy.ts](src/proxy.ts)

## 7. Instrucciones para Claude
- Priorizar cambios incrementales y seguros sobre grandes refactors
- Mantener compatibilidad con la arquitectura actual de Next.js App Router
- Preferir Server Components para datos sensibles y Client Components solo para interacción
- No exponer secretos ni claves en código cliente
- Validar cambios con `npm run lint` y, cuando sea posible, `npm run build`
- Si se tocan datos sensibles o storage, revisar primero políticas de Supabase y permisos
- Tratar de resolver primero problemas de tipado, seguridad y rendimiento antes de añadir nuevas funciones complejas
