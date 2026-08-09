import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/feed" className="flex items-center gap-2 mb-8 transition-opacity hover:opacity-60" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={18} />
          <span className="text-sm">volver</span>
        </Link>

        <h1 className="text-2xl font-medium mb-2" style={{ color: 'var(--text)' }}>Política de Privacidad de Petricor</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-subtle)' }}>Última actualización: [FECHA]</p>

        <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>

          <section>
            <h2 className="font-medium mb-2">1. Responsable del tratamiento</h2>
            <ul className="list-disc pl-5 flex flex-col gap-1" style={{ color: 'var(--text-muted)' }}>
              <li><strong>Titular:</strong> [NOMBRE COMPLETO / RAZÓN SOCIAL — pendiente]</li>
              <li><strong>NIF/CIF:</strong> [PENDIENTE]</li>
              <li><strong>Domicilio:</strong> [PENDIENTE]</li>
              <li><strong>Email de contacto:</strong> jaas210299@gmail.com</li>
              <li><strong>Ámbito:</strong> Almería, España</li>
            </ul>
          </section>

          <section>
            <h2 className="font-medium mb-2">2. Qué datos recopilamos</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Datos de registro (usuario, correo, contraseña cifrada), contenido que publicas (posts, comentarios,
              historias, mensajes, fotos, videos, notas de voz), datos de uso (likes, seguidores, visualizaciones,
              ubicación que añades voluntariamente a historias) y datos técnicos recogidos automáticamente
              (IP, navegador, fecha/hora de acceso). No recopilamos geolocalización en tiempo real.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">3. Finalidad del tratamiento</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Prestar el servicio de red social, autenticarte de forma segura, moderar contenido mediante nuestro
              sistema de reportes y bloqueos, mejorar la aplicación, y comunicarnos contigo si nos escribes o
              detectamos una incidencia.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">4. Base legal</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Ejecución de un contrato (prestarte el servicio), consentimiento (funciones opcionales), e interés
              legítimo (prevenir fraude, spam y abusos).
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">5. Con quién compartimos tus datos</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Usamos <strong>Supabase</strong> (base de datos, autenticación, almacenamiento) y <strong>Render</strong>{' '}
              (hosting) como encargados del tratamiento. No vendemos ni cedemos tus datos con fines publicitarios.
            </p>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
              <strong>Cloudflare Web Analytics:</strong> usamos esta herramienta para estadísticas generales de uso.
              No utiliza cookies ni recopila datos personales identificables, por lo que no requiere tu consentimiento
              previo conforme a la normativa de cookies.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">6. Cuánto tiempo conservamos tus datos</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Mientras tu cuenta esté activa. Las historias se eliminan automáticamente a las 24 horas. Si eliminas
              tu cuenta, tus datos se eliminan en un plazo razonable salvo obligación legal de conservarlos. El
              contenido reportado puede conservarse durante el proceso de moderación.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">7. Tus derechos</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Acceso, rectificación, supresión, limitación, portabilidad y oposición conforme al RGPD. Puedes
              ejercerlos escribiendo a jaas210299@gmail.com o eliminando tu cuenta directamente desde la app.
              Puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">8. Seguridad</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Contraseñas cifradas, conexiones HTTPS y control de acceso mediante políticas de seguridad a nivel de
              base de datos (RLS). Te notificaremos ante cualquier brecha de seguridad relevante.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">9. Menores de edad</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Petricor no está dirigido a menores de 14 años. Las cuentas de menores de esa edad serán eliminadas.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">10. Cambios en esta política</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Si actualizamos esta política de forma relevante, te lo notificaremos dentro de la aplicación antes de
              que entre en vigor.
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}