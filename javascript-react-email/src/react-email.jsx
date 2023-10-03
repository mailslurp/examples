//<gen>react-email-template
import * as React from 'react';
import { Html } from '@react-email/html';
import { Text } from '@react-email/text';

export function Email(props) {
    const { code } = props;
    return (
        <Html lang="en">
            <Text>Your code is: {code}</Text>
        </Html>
    );
}
//</gen>