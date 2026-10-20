/**
 * Componente Logo do Sistema IRPC.
 * Usa a imagem real /logo.png como ícone em todos os contextos visuais.
 */

interface Props {
  /** Tamanho do ícone em px (altura). Largura calculada proporcionalmente. */
  size?: number
  /** Mostrar nome "IRPC · UFVJM" e subtítulo ao lado do ícone */
  showText?: boolean
  /** Variante de cor do texto: 'dark' para fundo claro, 'light' para fundo escuro */
  variant?: 'dark' | 'light'
}

export default function Logo({ size = 40, showText = true, variant = 'light' }: Props) {
  // Proporção original da imagem: 660 × 828 → ~0.797 : 1
  const w = Math.round(size * 0.797)
  const nameColor    = variant === 'light' ? 'white'    : '#0A2240'
  const subColor     = variant === 'light' ? 'rgba(255,255,255,0.65)' : '#6B8299'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      {/* Ícone real */}
      <img
        src="/logo.png"
        alt="IRPC Logo"
        width={w}
        height={size}
        style={{
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
          // Fundo branco leve para o ícone se destacar em fundos escuros
          ...(variant === 'light' ? {} : {}),
        }}
      />

      {showText && (
        <div style={{ lineHeight: 1 }}>
          <div style={{
            fontWeight: 700,
            fontSize: size > 44 ? 20 : size > 30 ? 16 : 13,
            color: nameColor,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}>
            IRPC · UFVJM
          </div>
          {size > 28 && (
            <div style={{
              fontSize: size > 44 ? 11 : 10,
              color: subColor,
              marginTop: 3,
              whiteSpace: 'nowrap',
            }}>
              Índice de Risco de Paralisia Cerebral
            </div>
          )}
        </div>
      )}
    </div>
  )
}
