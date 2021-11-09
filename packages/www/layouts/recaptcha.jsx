import React from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

const RecaptchaComponent = (Component) => {
  const Recaptcha = ({ children }) => {
    return (
      <GoogleReCaptchaProvider
        reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
        language="en">
        {children}
      </GoogleReCaptchaProvider>
    );
  };

  return class Higher extends React.Component {
    render() {
      return (
        <Recaptcha>
          <Component {...this.props} />
        </Recaptcha>
      );
    }
  };
};
export { RecaptchaComponent };
