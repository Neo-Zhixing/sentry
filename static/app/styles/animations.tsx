import {keyframes} from '@emotion/react';

import {Theme} from 'app/utils/theme';

export const growIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.75);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

export const growDown = (height: string) => keyframes`
  0% {
    height: 0;
  }
  100% {
    height: ${height};
  }
`;

export const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

export const fadeOut = keyframes`
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

export const pulse = (size: number) => keyframes`
  0% {
    transform: scale(1,1);
  }
  50% {
    transform: scale(${size}, ${size});
  }
  100% {
    transform: scale(1, 1);
  }
`;

export const expandOut = keyframes`
  0% {
    transform: scale(1, 1);
    opacity: 1;
  }

  100% {
    transform: scale(5, 5);
    opacity: 0;
  }
`;

export const slideInRight = keyframes`
  0% {
    transform: translateX(20px);
    opacity: 0;
  }

  100% {
    transform: translateX(0);
    opacity: 1;
  }
`;

export const slideInLeft = keyframes`
  0% {
    transform: translateX(-20px);
    opacity: 0;
  }

  100% {
    transform: translateX(0);
    opacity: 1;
  }
`;

export const slideInUp = keyframes`
  0% {
    transform: translateY(10px);
    opacity: 0;
  }

  100% {
    transform: translateY(0);
    opacity: 1;
  }
`;

export const highlight = (color: string) => keyframes`
  0%,
  100% {
    background: rgba(255, 255, 255, 0);
  }

  25% {
    background: ${color};
  }
`;

export const alertHighlight = (priority: keyof Theme['alert'], theme: Theme) => keyframes`
  0%,
  100% {
    background: rgba(255, 255, 255, 0);
    border-color: transparent;
  }

  25% {
    background: ${theme.alert[priority].backgroundLight};
    border-color: ${theme.alert[priority].border};
  }
`;

export const shake = ({
  steps = 50,
  intensity = 3,
}: {steps?: number; intensity?: number | [number, number]} = {}) => keyframes`
${new Array(steps)
  .fill(0)
  .map((_, i) => {
    const [intensityX, intensityY] = Array.isArray(intensity)
      ? intensity
      : [intensity, intensity];

    const rand1 = Math.round(Math.random() * intensityX);
    const rand2 = Math.round(Math.random() * intensityY);

    return `${i * (99 / steps)}% {
      transform: translate(${rand1}px, ${rand2}px);
    }`;
  })
  .join('\n')}

  100% {
    transform: none;
  }
`;
