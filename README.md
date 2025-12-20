# Stacks Spray — Frontend para reclamar y dispersar tokens en Stacks

Dapp React que conecta tu wallet Stacks para reclamar distribuciones “Spray” y enviar STX/
SIP-010 a múltiples destinatarios.

## What it does

- Conecta una wallet Stacks y muestra red activa, dirección y estado.
- Verifica elegibilidad contra public/spray-distribution.json y ejecuta claim en el
  contrato spray.
- Dispersa STX a muchos destinatarios en una sola transacción (hasta 200 filas en el modo
  actual).
- Dispersa tokens SIP-010 de forma directa (hasta 10 destinatarios) indicando contrato y
  cantidades.
- Expone enlaces al Explorer de Stacks para seguir las transacciones.

## Who is it for

- Equipos que gestionan airdrops o distribuciones masivas en Stacks.
- Operadores/comunidades que necesitan dispersar STX o SIP-010 sin escribir scripts.
- Usuarios finales que deben reclamar su asignación de Spray con su wallet Stacks.

## Key Features

- Conexión de wallet vía @stacks/connect con detección de red mainnet/testnet (src/hooks/
  useStacksWallet.ts).
- Indicador de red y dirección con copia rápida (src/pages/HomePage.tsx).
- Reclamación de tokens Spray leyendo distribución JSON pública y llamando al contrato
  spray.claim (src/lib/claimSpray.ts).
- Modo “disperse-stx” (lista CSV) y “disperse-sip010” (contrato + lista CSV) usando
  @stacks/transactions (src/pages/DispersePage.tsx).
- Exploración de transacciones en explorer.hiro.so según red (src/config/stacks.ts).
- UI lista para móvil con tema claro/oscuro (src/components/Layout.tsx, src/index.css).

## How it works (High-level)

[Usuario] --conecta--> [UI React/Vite]
| |
|---- lee elegibilidad de ----> public/spray-distribution.json
|---- llama claim/disperse ---> Contratos Stacks (spray, spray-disperse\*)
|---- abre explorer ----------> https://explorer.stacks.co/txid/<tx>?chain=<net>

- Contrato spray-disperse en mainnet o spray-disperse-v2 en testnet (configurable por env).

## Tech Stack

- React 19 + TypeScript + Vite 7
- Stacks SDK: @stacks/connect, @stacks/network, @stacks/transactions
- React Router 7
- Tailwind CSS 4 (vía @import "tailwindcss" en src/index.css)
- Static build (dist/) listo para CDN u host estático

## Quick Start

### Requisitos previos

- Node.js ≥18 (requerido por Vite 7)
- pnpm (recomendado porque existe pnpm-lock.yaml)
- Wallet Stacks compatible con @stacks/connect (p.ej. Leather/Hiro) y saldo para fees

### Instalación

pnpm install

### Configuración env (.env.example → .env)

1. Copia .env.example a .env.
2. Ajusta VITE_STACKS_NETWORK a testnet o mainnet.
3. Define las direcciones/nombres de contrato según la red (ver tabla de Configuración).

### Correr local

pnpm dev

# abre http://localhost:5173

### Build y preview

pnpm build
pnpm preview

## Configuration

Variables de entorno (todas se leen en src/config/stacks.ts):

| Nombre                                   | Requerida                  | Default (fallback en código) | Descripción                                        |
| ---------------------------------------- | -------------------------- | ---------------------------- | -------------------------------------------------- |
| VITE_STACKS_NETWORK                      | Sí                         | testnet                      | Selecciona red (mainnet/testnet) para conexiones y |
| explorer.                                |
| VITE_MAINNET_SPRAY_CONTRACT_ADDRESS      | Sí en mainnet              |
| SPGFJDY5CPWX17DVFSN0N95Q6T7V8X4NQ8TPA39D | Contrato spray en mainnet. |
| VITE_MAINNET_DISPERSE_CONTRACT_NAME      | Opcional                   | spray-disperse               | Nombre del contrato de                             |
| dispersión en mainnet.                   |
| VITE_TESTNET_SPRAY_CONTRACT_ADDRESS      | Sí en testnet              |
| STGFJDY5CPWX17DVFSN0N95Q6T7V8X4NQ8RB7GF6 | Contrato spray en testnet. |
| VITE_TESTNET_DISPERSE_CONTRACT_NAME      | Opcional                   | spray-disperse-v2            | Nombre del contrato                                |
| de dispersión en testnet.                |

Otras configuraciones:

- public/spray-distribution.json: mapa de direcciones → montos permitidos para reclamar.
  Debe publicarse junto al build para que la verificación funcione.
- Endpoints Hiro: se usan https://api.hiro.so (mainnet) o https://api.testnet.hiro.so
  (testnet) configurados en stacksNetwork.

## Project Structure

- src/pages/HomePage.tsx: conexión de wallet y estado de red.
- src/pages/ClaimPage.tsx: verificación de elegibilidad y flujo de claim.
- src/pages/DispersePage.tsx: formularios de disperse STX y SIP-010.
- src/hooks/useStacksWallet.ts: manejo de sesión y dirección Stacks.
- src/lib/claimSpray.ts: llamada contract-call a spray.claim.
- src/config/stacks.ts: selección de red, contratos y URLs de explorer.
- public/spray-distribution.json: distribución usada en el cliente.
- src/index.css: estilos, temas y layout responsivo.

## Scripts

| Comando      | Qué hace                                                |
| ------------ | ------------------------------------------------------- |
| pnpm dev     | Inicia el servidor Vite en modo desarrollo.             |
| pnpm build   | Compila TypeScript y genera el build estático en dist/. |
| pnpm preview | Sirve el build de dist/ para prueba local.              |
| pnpm lint    | Ejecuta ESLint sobre el proyecto.                       |

## Deployment

- Build estático con pnpm build; hospeda el contenido de dist/ en tu CDN/host estático
  preferido.
- Asegura que las variables .env se apliquen en tiempo de build (Vite las inyecta con
  prefijo VITE\_).
- Incluye public/spray-distribution.json en el despliegue; actualízalo para la red
  objetivo.
- Verifica que la wallet Stacks esté disponible en el navegador objetivo (extensión
  instalada).

Production checklist

- VITE_STACKS_NETWORK=mainnet y direcciones/nombres de contrato finalizados.
- Distribución de elegibilidad actualizada y revisada.
- pnpm lint && pnpm build sin errores.
- Revisar que los enlaces al Explorer apunten a la red correcta.
- Confirmar que no se publican claves o .env sensibles en el host.

## Contributing

- Crea rama desde main, realiza cambios y abre PR.
- Ejecuta pnpm lint y, si aplica, pnpm build antes de enviar.
- Mantén las rutas y nombres de contrato coherentes con src/config/stacks.ts.

## Security / Responsible Disclosure

- El frontend no está auditado; úsalo bajo tu propio riesgo.
- Reporta hallazgos de seguridad de forma privada al equipo mantenedor (contacto
  pendiente).

## License

Pendiente (no se encontró archivo LICENSE).

## Open Questions / Missing Info

- Licencia del proyecto.
- Contratos definitivos (¿se confirman los valores por defecto o habrá direcciones finales
  distintas?).
- Proceso/documento de contribución y contacto para reportes de seguridad.
- Requisitos exactos de versión de Node/package manager para producción.
