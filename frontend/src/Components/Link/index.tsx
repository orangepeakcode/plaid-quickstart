import React, { useEffect, useContext, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import Button from "plaid-threads/Button";

import Context from "../../Context";
import { Products } from "plaid";

const Link = ({ generateToken }: { generateToken: any }) => {
  const { linkToken, isPaymentInitiation, dispatch } = useContext(Context);

  const [access_token, setAccessToken] = useState("");

  const onSuccess = React.useCallback(
    (public_token: string) => {
      // If the access_token is needed, send public_token to server
      const exchangePublicTokenForAccessToken = async () => {
        const response = await fetch("/api/set_access_token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          body: `public_token=${public_token}`,
        });
        if (!response.ok) {
          dispatch({
            type: "SET_STATE",
            state: {
              itemId: `no item_id retrieved`,
              accessToken: `no access_token retrieved`,
              isItemAccess: false,
            },
          });
          return;
        }
        const data = await response.json();
        dispatch({
          type: "SET_STATE",
          state: {
            itemId: data.item_id,
            accessToken: data.access_token,
            isItemAccess: true,
          },
        });
      };

      // 'payment_initiation' products do not require the public_token to be exchanged for an access_token.
      if (isPaymentInitiation) {
        dispatch({ type: "SET_STATE", state: { isItemAccess: false } });
      } else {
        exchangePublicTokenForAccessToken();
      }

      dispatch({ type: "SET_STATE", state: { linkSuccess: true } });
      window.history.pushState("", "", "/");
    },
    [dispatch]
  );

  let isOauth = false;
  const config: Parameters<typeof usePlaidLink>[0] = {
    token: linkToken!,
    onSuccess,
  };

  if (window.location.href.includes("?oauth_state_id=")) {
    // TODO: figure out how to delete this ts-ignore
    // @ts-ignore
    config.receivedRedirectUri = window.location.href;
    isOauth = true;
  }

  const { open, ready } = usePlaidLink(config);

  useEffect(() => {
    if (isOauth && ready) {
      open();
    }
  }, [ready, open, isOauth]);

  useEffect(() => {
    generateToken(
      undefined,
      access_token.trim().length === 0 ? null : access_token.trim()
    );
  }, [access_token]);

  return (
    <>
      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontWeight: "bold", marginRight: "12px" }}>
          Access Token
        </label>
        <input
          onChange={(e) => setAccessToken(e.currentTarget.value || "")}
          style={{ padding: "4px" }}
        ></input>
      </div>
      <Button
        type="button"
        large
        onClick={() => {
          open();
        }}
        disabled={!ready}
      >
        Launch Link
      </Button>
    </>
  );
};

Link.displayName = "Link";

export default Link;
