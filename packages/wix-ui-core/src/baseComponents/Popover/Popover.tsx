import * as React from 'react';
import PopperJS from 'popper.js';
import {getScrollParent} from 'popper.js/dist/umd/popper-utils';
import style from './Popover.st.css';
import {Manager, Target, Popper, Arrow} from 'react-popper';
import {CSSTransition} from 'react-transition-group';
import {Portal} from 'react-portal';
import {buildChildrenObject, createComponentThatRendersItsChildren, ElementProps} from '../../utils';
import {oneOf, oneOfType, element} from 'prop-types';
const isElement = require('lodash/isElement');

// This is here and not in the test setup because we don't want consumers to need to run it as well
const isTestEnv = process.env.NODE_ENV === 'test';
if (isTestEnv) {
  if (!document.createRange) {
    document.createRange = () => ({
      setStart: () => null,
      setEnd: () => null,
      commonAncestorContainer: document.documentElement.querySelector('body')
    } as any);
  }
}

export type Placement = PopperJS.Placement;
export type AppendTo = PopperJS.Boundary | Element;
export const AppendToPropType = oneOfType([
  oneOf(['scrollParent', 'viewport', 'window']),
  element
]);

export interface PopoverProps {
  /** The location to display the content */
  placement: Placement;
  /** Is the content shown or not */
  shown: boolean;
  /** onClick on the component */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  /** onMouseEnter on the component */
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  /** onMouseLeave on the component */
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
  /** onKeyDown on the target component */
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  /** Show show arrow from the content */
  showArrow?: boolean;
  /** Moves poppover relative to the parent */
  moveBy?: {x: number, y: number};
  /** Fade Delay */
  hideDelay?: number;
  /** Show Delay */
  showDelay?: number;
  /** Moves arrow by amount */
  moveArrowTo?: number;
  /** Enables calculations in relation to a dom element */
  appendTo?: AppendTo;
  /** Enables calculations in relation to the parent element*/
  appendToParent?: boolean;
  /** Animation timer */
  timeout?: number;
}

export type PopoverState = {
  isMounted: boolean;
};

export type PopoverType = PopoverProps & {
  Element?: React.SFC<ElementProps>;
  Content?: React.SFC<ElementProps>;
};

const getArrowShift = (shift: number | undefined, direction: string) => {
  if (!shift && !isTestEnv) {
    return {};
  }

  return {
    [direction === 'top' || direction === 'bottom' ? 'left' : 'top']: `${shift}px`
  };
};

const createModifiers = ({moveBy, appendToParent, appendTo}) => {
  const modifiers: PopperJS.Modifiers = {
    offset: {
      offset: `${moveBy ? moveBy.x : 0}px, ${moveBy ? moveBy.y : 0}px`
    }
  };

  if (isTestEnv) {
    modifiers.computeStyle = {enabled: false};
  }

  const target = appendToParent ? null : appendTo  || null;
  if (target) {
    modifiers.preventOverflow = {
      boundariesElement: target
    };
  }

  return modifiers;
};

const renderPopper = ({modifiers, placement, showArrow, moveArrowTo, childrenObject, targetRef}) => {
  let appendToElement = null;
  const boundariesElement = modifiers.preventOverflow && modifiers.preventOverflow.boundariesElement ;

  if (boundariesElement === 'window' || boundariesElement === 'viewport') {
    appendToElement = document.body;
  } else if (boundariesElement === 'scrollParent') {
    appendToElement = getScrollParent(targetRef);
  } else if (isElement(boundariesElement)) {
    appendToElement = boundariesElement;
  }

  const popper = (
    <Popper
      data-hook="popover-content"
      modifiers={modifiers}
      placement={placement}
      className={`${style.popover} ${showArrow ? style.withArrow : style.popoverContent}`}>
      {
        showArrow &&
          <Arrow data-hook="popover-arrow"
              className={style.arrow}
              style={getArrowShift(moveArrowTo, placement)}
          />
      }
      {
        showArrow &&
          <div className={style.popoverContent}>
            {childrenObject.Content}
          </div>
      }
      {
        !showArrow &&
          childrenObject.Content
      }
    </Popper>
  );

  if (!appendToElement) {
    return popper;
  }

  return (
    <Portal node={appendToElement}>
      {popper}
    </Portal>
  );
};

/**
 * Popover
 */
export class Popover extends React.Component<PopoverType, PopoverState> {
  static Element = createComponentThatRendersItsChildren('Popover.Element');
  static Content = createComponentThatRendersItsChildren('Popover.Content');
  static defaultProps = {
    timeout: 150
  };

  targetRef: HTMLElement = null;

  constructor(props: PopoverProps) {
    super(props);

    this.state = {
      isMounted: false
    };
  }

  componentDidMount() {
    this.setState({isMounted: true});
  }

  render() {
    const {
      placement,
      shown,
      onMouseEnter,
      onMouseLeave,
      onKeyDown,
      onClick,
      showArrow,
      children,
      moveBy,
      moveArrowTo,
      timeout,
      appendToParent,
      appendTo
    } = this.props;

    const {isMounted} = this.state;

    const childrenObject = buildChildrenObject(children, {Element: null, Content: null});
    const modifiers = createModifiers({moveBy, appendToParent, appendTo});

    return (
      <Manager
        {...style('root', {}, this.props)}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}>
        <Target onKeyDown={onKeyDown} data-hook="popover-element">
          <div ref={r => this.targetRef = r}>
            {childrenObject.Element}
          </div>
        </Target>
        {
          !!timeout && isMounted &&
            <CSSTransition in={shown} timeout={Number(timeout)} unmountOnExit={true} classNames={style.popoverAnimation}>
              {renderPopper({modifiers, placement, showArrow, moveArrowTo, childrenObject, targetRef: this.targetRef})}
            </CSSTransition>
        }
        {
          !timeout && shown && isMounted &&
          renderPopper({modifiers, placement, showArrow, moveArrowTo, childrenObject, targetRef: this.targetRef})
        }
      </Manager>
    );
  }
}
