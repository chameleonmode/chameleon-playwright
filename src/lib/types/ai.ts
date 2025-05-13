
  /**
   * A click action.
   */
  export interface Click {
    /**
     * Indicates which mouse button was pressed during the click. One of `left`,
     * `right`, `wheel`, `back`, or `forward`.
     */
    button: 'left' | 'right' | 'wheel' | 'back' | 'forward';

    /**
     * Specifies the event type. For a click action, this property is always set to
     * `click`.
     */
    type: 'click';

    /**
     * The x-coordinate where the click occurred.
     */
    x: number;

    /**
     * The y-coordinate where the click occurred.
     */
    y: number;
  }

  /**
   * A double click action.
   */
  export interface DoubleClick {
    /**
     * Specifies the event type. For a double click action, this property is always set
     * to `double_click`.
     */
    type: 'double_click';

    /**
     * The x-coordinate where the double click occurred.
     */
    x: number;

    /**
     * The y-coordinate where the double click occurred.
     */
    y: number;
  }

  /**
   * A drag action.
   */
  export interface Drag {
    /**
     * An array of coordinates representing the path of the drag action. Coordinates
     * will appear as an array of objects, eg
     *
     * ```
     * [
     *   { x: 100, y: 200 },
     *   { x: 200, y: 300 }
     * ]
     * ```
     */
    path: Array<Drag.Path>;

    /**
     * Specifies the event type. For a drag action, this property is always set to
     * `drag`.
     */
    type: 'drag';
  }

  export namespace Drag {
    /**
     * A series of x/y coordinate pairs in the drag path.
     */
    export interface Path {
      /**
       * The x-coordinate.
       */
      x: number;

      /**
       * The y-coordinate.
       */
      y: number;
    }
  }

  /**
   * A collection of keypresses the model would like to perform.
   */
  export interface Keypress {
    /**
     * The combination of keys the model is requesting to be pressed. This is an array
     * of strings, each representing a key.
     */
    keys: Array<string>;

    /**
     * Specifies the event type. For a keypress action, this property is always set to
     * `keypress`.
     */
    type: 'keypress';
  }

  /**
   * A mouse move action.
   */
  export interface Move {
    /**
     * Specifies the event type. For a move action, this property is always set to
     * `move`.
     */
    type: 'move';

    /**
     * The x-coordinate to move to.
     */
    x: number;

    /**
     * The y-coordinate to move to.
     */
    y: number;
  }

  /**
   * A screenshot action.
   */
  export interface Screenshot {
    /**
     * Specifies the event type. For a screenshot action, this property is always set
     * to `screenshot`.
     */
    type: 'screenshot';
  }

  /**
   * A scroll action.
   */
  export interface Scroll {
    /**
     * The horizontal scroll distance.
     */
    scroll_x: number;

    /**
     * The vertical scroll distance.
     */
    scroll_y: number;

    /**
     * Specifies the event type. For a scroll action, this property is always set to
     * `scroll`.
     */
    type: 'scroll';

    /**
     * The x-coordinate where the scroll occurred.
     */
    x: number;

    /**
     * The y-coordinate where the scroll occurred.
     */
    y: number;
  }

  /**
   * An action to type in text.
   */
  export interface Type {
    /**
     * The text to type.
     */
    text: string;

    /**
     * Specifies the event type. For a type action, this property is always set to
     * `type`.
     */
    type: 'type';
  }

  /**
   * A wait action.
   */
  export interface Wait {
    /**
     * Specifies the event type. For a wait action, this property is always set to
     * `wait`.
     */
    type: 'wait';
  }


export type Actionable = {
  type: "click" | "scroll" | "keypress" | "type" | "wait" | "screenshot";
  action: Click | DoubleClick | Drag | Keypress | Move | Screenshot | Scroll | Type | Wait;
}