import { KeyboardEvent } from 'react';

interface IKeyboardEvent<T> extends KeyboardEvent<T> {
  target: HTMLInputElement;
}

export default IKeyboardEvent;
