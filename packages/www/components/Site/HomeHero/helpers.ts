import { phoneFrameMaxWidth, phoneFrameMaxHeight } from "./PhoneSvg";

const phonePadding = 48;

const maxScroll = 1082;
const scrollToEnterPhone = maxScroll - phoneFrameMaxHeight;

export type Breakpoint = {
  initial: number;
  target: number;
  formatter: (value: number) => string;
};

const breakpoints: { [key: string]: Breakpoint } = {
  rotateX: {
    initial: 45,
    target: 0,
    formatter: (rotateX: number) =>
      `perspective(800px) rotateX(${rotateX}deg) rotateY(0deg) scale(1)`,
  },
  opacity: {
    initial: 0.7,
    target: 1,
    formatter: (v: number) => `${v}`,
  },
  gradientOpacity: {
    initial: 1,
    target: 0,
    formatter: (v: number) => `${v}`,
  },
  maxWidth: {
    initial: 916,
    target: phoneFrameMaxWidth - phonePadding, // 40 is the padding of the phone
    formatter: (v: number) => `${v}px`,
  },
  aspectRatio: {
    initial: 50,
    target: 46.5,
    formatter: (v: number) => `${v.toFixed(2)}%`,
  },
};

/**
 * To calculate value in proportion of the scrollTop
 */
function getProportionalValue(
  scrollTop: number,
  breakpoint: Breakpoint,
  scrollFrom = 0,
  scrollTo = scrollToEnterPhone
) {
  // 1. We get the fraction scrolled
  const currentScrollFraction =
    (scrollTop - scrollFrom) / (scrollTo - scrollFrom);
  if (currentScrollFraction > 1) return breakpoint.formatter(breakpoint.target);
  // 2. We get the scope
  const scope = breakpoint.initial - breakpoint.target;
  // 3. We calculate what we'll substract from the total
  const toSubstract = scope * currentScrollFraction;
  // 4. Substract and format
  const value = Math.round((breakpoint.initial - toSubstract) * 100) / 100;
  return breakpoint.formatter(value);
}

export type DynamicBreakpoints = {
  maxWidth: Breakpoint;
};

function getPhonePadding() {
  const { clientWidth } = document.querySelector("#phone-frame") as SVGElement;
  const paddingFraction = 25 / 788;
  return Math.round(clientWidth * paddingFraction * 100) / 100;
}

/**
 * Some breakpoints depend on the frame's width, which is retrieved on render
 */
function getDynamicBreakpoints(): DynamicBreakpoints {
  const { clientWidth } = document.querySelector("#phone-frame") as SVGElement;

  const maxMaxWidth = window.innerWidth * 0.8;
  const initialMaxWidthCandidate = clientWidth * 1.2;

  const phonePadding = getPhonePadding();

  return {
    maxWidth: {
      initial:
        initialMaxWidthCandidate < maxMaxWidth
          ? initialMaxWidthCandidate
          : maxMaxWidth,
      target: clientWidth - phonePadding * 2,
      formatter: (v: number) => `${v}px`,
    },
  };
}

export {
  maxScroll,
  scrollToEnterPhone,
  breakpoints,
  getProportionalValue,
  getPhonePadding,
  getDynamicBreakpoints,
};
