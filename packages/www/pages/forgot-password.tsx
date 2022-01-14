import Layout from "layouts/main";
import Login from "@components/Marketing/Login";
import {
  Flex,
  Box,
  Heading,
  Container,
  Link as A,
} from "@livepeer.com/design-system";
import { useState } from "react";
import { useApi, useLoggedIn } from "hooks";
import Link from "next/link";
import Guides from "@components/Marketing/Guides";
import { ForgotPassword as Content } from "content";

const ForgotPasswordPage = () => {
  useLoggedIn(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { makePasswordResetToken } = useApi();
  const onSubmit = async ({ email }) => {
    setLoading(true);
    setErrors([]);
    const res = await makePasswordResetToken(email);
    if (res.errors) {
      setLoading(false);
      setErrors(res.errors);
    } else {
      setSuccess(true);
    }
  };

  return (
    <Layout {...Content.metaData}>
      <Guides backgroundColor="$mauve2" />
      {success ? (
        <Box
          css={{
            minHeight: "calc(100vh - 510px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}>
          Password reset link sent to your email.
        </Box>
      ) : (
        <Box css={{ position: "relative" }}>
          <Container
            size="3"
            css={{
              px: "$6",
              py: "$7",
              width: "100%",
              "@bp3": {
                py: "$8",
                px: "$4",
              },
            }}>
            <Flex
              align="center"
              justify="center"
              css={{
                flexGrow: 1,
                flexDirection: "column",
              }}>
              <Heading size="3" as="h1" css={{ mb: "$5" }}>
                Reset your password
              </Heading>
              <Login
                id="forgot-password"
                showEmail={true}
                showPassword={false}
                buttonText="Get reset link"
                onSubmit={onSubmit}
                errors={errors}
                loading={loading}
              />
              <Box>
                Nevermind!&nbsp;
                <Link href="/login" passHref>
                  <A>Take me back to log in</A>
                </Link>
              </Box>
            </Flex>
          </Container>
        </Box>
      )}
    </Layout>
  );
};

export default ForgotPasswordPage;
