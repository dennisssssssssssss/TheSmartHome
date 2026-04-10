import React from 'react'

interface DeviceIllustrationProps {
  type: string
  isOn: boolean
  value?: number
}

export const DeviceIllustration: React.FC<DeviceIllustrationProps> = ({ type, isOn, value = 0 }) => {
  const goldColor = '#C9A84C'
  const greyColor = '#555555'
  const amberGlow = '#E8C97A'

  switch (type) {
    case 'bulb':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <defs>
            {isOn && (
              <radialGradient id="bulb-glow" cx="50%" cy="50%">
                <stop offset="0%" stopColor={amberGlow} stopOpacity="0.8" />
                <stop offset="50%" stopColor={goldColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            )}
          </defs>
          {isOn && <circle cx="100" cy="60" r="40" fill="url(#bulb-glow)" />}
          <ellipse cx="100" cy="75" rx="15" ry="18" fill="none" stroke={isOn ? goldColor : greyColor} strokeWidth="1.5" />
          <path
            d="M 90 45 Q 100 20 110 45 L 108 65 Q 100 70 92 65 Z"
            fill="none"
            stroke={isOn ? goldColor : greyColor}
            strokeWidth="1.5"
          />
          <line x1="100" y1="35" x2="100" y2="50" stroke={isOn ? amberGlow : greyColor} strokeWidth="1" />
          <path d="M 95 50 L 100 35 L 105 50" fill="none" stroke={isOn ? amberGlow : greyColor} strokeWidth="1" />
        </svg>
      )

    case 'thermostat':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <circle cx="100" cy="60" r="35" fill="none" stroke={isOn ? goldColor : greyColor} strokeWidth="1.5" />
          <path
            d="M 100 30 A 30 30 0 0 1 130 60"
            fill="none"
            stroke={isOn ? goldColor : greyColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <text
            x="100"
            y="70"
            textAnchor="middle"
            fontSize="24"
            fontFamily="Cormorant Garamond"
            fontWeight="300"
            fill={isOn ? goldColor : greyColor}
          >
            {value}°
          </text>
        </svg>
      )

    case 'tv':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <defs>
            {isOn && (
              <linearGradient id="tv-screen" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4A90E2" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#2E5C8A" stopOpacity="0.2" />
              </linearGradient>
            )}
          </defs>
          <rect
            x="40"
            y="30"
            width="120"
            height="70"
            rx="2"
            fill={isOn ? 'url(#tv-screen)' : 'transparent'}
            stroke={isOn ? goldColor : greyColor}
            strokeWidth="2"
          />
          <rect x="38" y="28" width="124" height="74" rx="3" fill="none" stroke={isOn ? goldColor : greyColor} strokeWidth="1" />
          <line x1="95" y1="100" x2="105" y2="100" stroke={isOn ? goldColor : greyColor} strokeWidth="1.5" />
        </svg>
      )

    case 'lock':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <path
            d="M 80 55 L 80 45 Q 80 30 100 30 Q 120 30 120 45 L 120 55"
            fill="none"
            stroke={isOn ? goldColor : greyColor}
            strokeWidth="2"
          />
          <rect
            x="70"
            y="55"
            width="60"
            height="40"
            rx="2"
            fill="transparent"
            stroke={isOn ? goldColor : greyColor}
            strokeWidth="2"
          />
          <circle cx="100" cy="75" r="5" fill={isOn ? goldColor : greyColor} />
        </svg>
      )

    case 'motion':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <circle cx="100" cy="60" r="8" fill={isOn ? goldColor : greyColor} opacity={isOn ? 1 : 0.3} />
          <circle cx="100" cy="60" r="18" fill="none" stroke={isOn ? goldColor : greyColor} strokeWidth="1.5" opacity={isOn ? 0.6 : 0.2} />
          <circle cx="100" cy="60" r="28" fill="none" stroke={isOn ? goldColor : greyColor} strokeWidth="1" opacity={isOn ? 0.4 : 0.1} />
          <circle cx="100" cy="60" r="38" fill="none" stroke={isOn ? goldColor : greyColor} strokeWidth="0.5" opacity={isOn ? 0.2 : 0.05} />
        </svg>
      )

    case 'door':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <defs>
            {isOn && (
              <linearGradient id="door-light" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={amberGlow} stopOpacity="0.6" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            )}
          </defs>
          {isOn && <rect x="90" y="30" width="50" height="70" fill="url(#door-light)" />}
          <rect
            x="60"
            y="30"
            width="50"
            height="70"
            rx="1"
            fill="transparent"
            stroke={isOn ? goldColor : greyColor}
            strokeWidth="2"
          />
          <circle cx="105" cy="65" r="2" fill={isOn ? goldColor : greyColor} />
          <line x1="110" y1="30" x2="110" y2="100" stroke={isOn ? goldColor : greyColor} strokeWidth="1.5" strokeDasharray="2,2" />
        </svg>
      )

    case 'camera':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <circle cx="100" cy="60" r="25" fill="none" stroke={isOn ? goldColor : greyColor} strokeWidth="2" />
          <circle cx="100" cy="60" r="15" fill="none" stroke={isOn ? goldColor : greyColor} strokeWidth="1.5" />
          <circle cx="100" cy="60" r="5" fill={goldColor} />
          {isOn && <circle cx="125" cy="40" r="3" fill="#8B3A3A" className="animate-pulse" />}
        </svg>
      )

    case 'speaker':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <rect x="80" y="40" width="6" height="40" rx="3" fill={isOn ? goldColor : greyColor} opacity={isOn ? 1 : 0.3}>
            {isOn && <animate attributeName="height" values="40;50;40" dur="1.5s" repeatCount="indefinite" />}
            {isOn && <animate attributeName="y" values="40;35;40" dur="1.5s" repeatCount="indefinite" />}
          </rect>
          <rect x="90" y="35" width="6" height="50" rx="3" fill={isOn ? goldColor : greyColor} opacity={isOn ? 0.8 : 0.3}>
            {isOn && <animate attributeName="height" values="50;60;50" dur="1.2s" repeatCount="indefinite" />}
            {isOn && <animate attributeName="y" values="35;30;35" dur="1.2s" repeatCount="indefinite" />}
          </rect>
          <rect x="100" y="30" width="6" height="60" rx="3" fill={isOn ? goldColor : greyColor} opacity={isOn ? 1 : 0.3}>
            {isOn && <animate attributeName="height" values="60;70;60" dur="1.8s" repeatCount="indefinite" />}
            {isOn && <animate attributeName="y" values="30;25;30" dur="1.8s" repeatCount="indefinite" />}
          </rect>
          <rect x="110" y="35" width="6" height="50" rx="3" fill={isOn ? goldColor : greyColor} opacity={isOn ? 0.8 : 0.3}>
            {isOn && <animate attributeName="height" values="50;55;50" dur="1.4s" repeatCount="indefinite" />}
            {isOn && <animate attributeName="y" values="35;32;35" dur="1.4s" repeatCount="indefinite" />}
          </rect>
        </svg>
      )

    case 'plug':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <rect
            x="70"
            y="45"
            width="60"
            height="45"
            rx="4"
            fill="transparent"
            stroke={isOn ? goldColor : greyColor}
            strokeWidth="2"
          />
          <rect x="88" y="60" width="8" height="15" rx="1" fill={isOn ? goldColor : greyColor} />
          <rect x="104" y="60" width="8" height="15" rx="1" fill={isOn ? goldColor : greyColor} />
          <circle cx="100" cy="80" r="3" fill={isOn ? goldColor : greyColor} />
        </svg>
      )

    case 'ac':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <circle cx="100" cy="60" r="30" fill="none" stroke={isOn ? goldColor : greyColor} strokeWidth="1.5" />
          <path
            d="M 100 40 L 100 60 L 115 50 M 100 60 L 85 50 M 100 60 L 100 80"
            stroke={isOn ? goldColor : greyColor}
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          >
            {isOn && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 100 60"
                to="360 100 60"
                dur="3s"
                repeatCount="indefinite"
              />
            )}
          </path>
        </svg>
      )

    case 'blinds':
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <rect x="60" y="30" width="80" height="3" fill={isOn ? goldColor : greyColor} />
          <rect x="60" y="38" width="80" height="3" fill={isOn ? goldColor : greyColor} opacity="0.9" />
          <rect x="60" y="46" width="80" height="3" fill={isOn ? goldColor : greyColor} opacity="0.8" />
          <rect x="60" y="54" width="80" height="3" fill={isOn ? goldColor : greyColor} opacity="0.7" />
          <rect x="60" y="62" width="80" height="3" fill={isOn ? goldColor : greyColor} opacity="0.6" />
          <rect x="60" y="70" width="80" height="3" fill={isOn ? goldColor : greyColor} opacity="0.5" />
          <rect x="60" y="78" width="80" height="3" fill={isOn ? goldColor : greyColor} opacity="0.4" />
          <rect x="60" y="86" width="80" height="3" fill={isOn ? goldColor : greyColor} opacity="0.3" />
        </svg>
      )

    default:
      return (
        <svg viewBox="0 0 200 120" className="w-full h-full">
          <circle cx="100" cy="60" r="20" fill="none" stroke={isOn ? goldColor : greyColor} strokeWidth="2" />
        </svg>
      )
  }
}
