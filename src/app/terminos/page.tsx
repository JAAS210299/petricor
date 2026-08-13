import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TerminosPage() {
  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/feed" className="flex items-center gap-2 mb-8 transition-opacity hover:opacity-60" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={18} />
          <span className="text-sm">volver</span>
        </Link>

        <h1 className="text-2xl font-medium mb-2" style={{ color: 'var(--text)' }}>Términos de Uso de Petricor</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-subtle)' }}>Última actualización: [FECHA]</p>

        <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>

          <section>
            <h2 className="font-medium mb-2">1. Aceptación de los términos</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Al crear una cuenta en Petricor aceptas estos términos y nuestra Política de Privacidad. Si no estás
              de acuerdo, no debes usar la aplicación.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">2. Requisitos para usar Petricor</h2>
            <ul className="list-disc pl-5 flex flex-col gap-1" style={{ color: 'var(--text-muted)' }}>
              <li>Debes tener al menos 14 años</li>
              <li>Debes proporcionar información veraz al registrarte</li>
              <li>Eres responsable de mantener segura tu contraseña</li>
              <li>No se permite más de una cuenta con fines de suplantación o abuso</li>
            </ul>
          </section>

          <section>
            <h2 className="font-medium mb-2">3. Normas de comunidad</h2>
            <p className="mb-2" style={{ color: 'var(--text-muted)' }}>Te comprometes a NO publicar:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1" style={{ color: 'var(--text-muted)' }}>
              <li>Contenido de odio, acoso o amenazas</li>
              <li>Violencia gráfica o contenido que incite a ella</li>
              <li>Desnudez o contenido sexual explícito</li>
              <li>Información falsa con intención de engañar</li>
              <li>Spam o cuentas automatizadas no autorizadas</li>
              <li>Contenido que infrinja derechos de propiedad intelectual de terceros</li>
              <li>Suplantación de identidad de otra persona</li>
            </ul>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
              El incumplimiento puede conllevar eliminación de contenido, suspensión o cierre de cuenta.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">4. Contenido publicado por los usuarios</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Eres el único responsable de tu contenido. Nos concedes una licencia no exclusiva para almacenarlo y
              mostrarlo dentro de la app con el único fin de prestarte el servicio. Puedes eliminarlo en cualquier
              momento. No revisamos el contenido antes de publicarse; contamos con un sistema de reportes.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">5. Moderación</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Contamos con herramientas de bloqueo y reporte. Nos reservamos el derecho de revisar, eliminar
              contenido o suspender cuentas que incumplan estos términos.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">6. Historias temporales</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              El contenido publicado como "historia" se elimina automáticamente a las 24 horas. No garantizamos su
              recuperación una vez eliminado.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">7. Cuentas verificadas</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              La insignia de verificación se concede a criterio del equipo de Petricor y no constituye garantía
              adicional sobre la identidad o veracidad del contenido de esa cuenta.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">8. Funciones de pago</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Si Petricor ofrece suscripciones de pago, se te informará del precio, periodicidad y forma de
              cancelar antes de confirmar cualquier pago. Los pagos se procesan mediante proveedores externos
              (p. ej. Stripe), sujetos a sus propias condiciones.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">9. Propiedad intelectual</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              El diseño, marca, logotipo y código de Petricor son propiedad de [NOMBRE / RAZÓN SOCIAL — pendiente].
              Esto no afecta a tu propiedad sobre el contenido que publicas.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">10. Limitación de responsabilidad</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Petricor se presta "tal cual". No garantizamos disponibilidad ininterrumpida ni ausencia de errores.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">11. Cierre de cuenta</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Puedes eliminar tu cuenta en cualquier momento desde los ajustes de perfil.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">12. Cambios en estos términos</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Si el cambio es sustancial, se te notificará dentro de la aplicación antes de que entre en vigor.
            </p>
          </section>

          <section>
            <h2 className="font-medium mb-2">13. Contacto y legislación aplicable</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              jaas210299@gmail.com — Estos términos se rigen por la legislación española.
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}