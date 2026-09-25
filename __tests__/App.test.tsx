/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });

  expect(GoogleSignin.configure).not.toHaveBeenCalled();
});
