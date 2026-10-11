// The real picker keeps its own copy of the time, which only resets when it is unmounted.
jest.mock('react-native-paper-dates', () => ({ TimePickerModal: () => null }));

import { act } from 'react';
import { Button } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import renderer, { type ReactTestRenderer } from 'react-test-renderer';
import TimeField from './TimeField';

test('the picker exists only while open, so a cancelled choice is not remembered', async () => {
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<TimeField label="Wake-up time" value="18:30" hour24 onChange={() => {}} />);
  });
  const pickers = () => tree.root.findAllByType(TimePickerModal);

  expect(pickers().length).toBe(0);
  // The button shows the time in the chosen format.
  expect(tree.root.findByType(Button).props.children).toBe('18:30');

  await act(async () => {
    tree.root.findByType(Button).props.onPress();
  });
  expect(pickers().length).toBe(1);
  expect(pickers()[0].props).toMatchObject({ visible: true, hours: 18, minutes: 30, use24HourClock: true });

  await act(async () => {
    pickers()[0].props.onDismiss();
  });
  expect(pickers().length).toBe(0);
});
