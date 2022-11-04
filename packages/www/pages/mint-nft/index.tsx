import { useToggleState } from "hooks/use-toggle-state";
import { useApi, useLoggedIn } from "hooks";
import { useMetaMask } from "metamask-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { minter, chains } from "@livepeer/video-nft";

import Spinner from "components/Dashboard/Spinner";
import {
  Link as A,
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Label,
  Text,
  TextField,
  Tooltip,
} from "@livepeer/design-system";
import { MintNFT as Content } from "content";
import Layout from "layouts/main";

async function richMintNft(
  minter: minter.Web3,
  contractAddress: string,
  to: string,
  tokenUri: string,
  logger: (log: JSX.Element | string) => void,
  chain: chains.BuiltinChainInfo
) {
  try {
    logger("Started mint transaction...");
    const tx = await minter.mintNft(tokenUri, contractAddress, to);
    logger(
      <>
        Mint transaction sent:{" "}
        <Link
          href={`${chain.spec.blockExplorerUrls[0]}/tx/${tx.hash}`}
          passHref
          legacyBehavior>
          <A target="_blank">{displayAddr(tx.hash)}</A>
        </Link>
      </>
    );

    const info = await minter.getMintedNftInfo(tx);
    logger(
      <>
        {info?.opensea?.tokenUrl ? (
          <>
            Successfully minted token <code>{info.tokenId}</code> to{" "}
            {displayAddr(to)}! Check it on{" "}
          </>
        ) : (
          `NFT minted but failed to find token ID. Check last minted NFTs on `
        )}
        <Link
          href={info?.opensea?.tokenUrl ?? info?.opensea?.contractUrl}
          passHref
          legacyBehavior>
          <A target="_blank">OpenSea</A>
        </Link>
      </>
    );
  } catch (err) {
    let log = `Error during minting process: ${err.message}`;
    if ("data" in err) {
      const errData = (err as any).data;
      log += `: ${errData.message || errData.details}`;
    }
    logger(log);
  }
}

const displayAddr = (str: string) => (
  <code>
    {str.slice(0, 5)}…{str.slice(-4)}
  </code>
);

async function richSwitchChain(
  ethereum: any,
  spec: chains.ChainSpec,
  logger: (log: JSX.Element | string) => void
) {
  try {
    const { added } = await chains.switchOrAddChain(ethereum, spec);
    logger(
      added
        ? "Successfully added Polygon network to MetaMask."
        : "Successfully switched to Polygon network."
    );
  } catch (err) {
    logger(`Error switching to Polygon network: ${err.message}`);
  }
}

export default function MintNFT() {
  const { status, connect, account, chainId, ethereum } = useMetaMask();
  const { user, token: jwt, endpoint } = useApi();
  const videoNft = useMemo(
    () =>
      new minter.FullMinter({ auth: { jwt }, endpoint }, { ethereum, chainId }),
    [ethereum, chainId, jwt, endpoint]
  );
  const isMinting = useToggleState();
  const isUploading = useToggleState();

  const initState = useMemo(() => {
    if (typeof window === "undefined") {
      return {};
    }
    const searchParams = new URLSearchParams(window.location.search);
    return {
      file: null as File,
      contractAddress: searchParams.get("contractAddress"),
      tokenUri: searchParams.get("tokenUri"),
      recipient: searchParams.get("recipient"),
    };
  }, [typeof window !== "undefined" && window?.location?.search]);
  const defaultContractAddress = useMemo<string>(
    () => chains.getBuiltinChain(chainId)?.defaultContract,
    [chainId]
  );
  const [state, setState] = useState(initState);
  type State = typeof state;
  const setStateProp = <T extends keyof State>(prop: T, value: State[T]) => {
    setState({ ...state, [prop]: value });
  };

  const [logs, setLogs] = useState<JSX.Element[]>([]);
  const addLog = useCallback(
    (log: JSX.Element | string) =>
      setLogs((prev) => [
        ...prev,
        <>
          [{new Date().toLocaleTimeString()}] {log}
        </>,
      ]),
    [setLogs]
  );

  const onClickMint = useCallback(async () => {
    isMinting.onOn();
    try {
      await richMintNft(
        videoNft.web3,
        state.contractAddress ?? defaultContractAddress,
        state.recipient ?? account,
        state.tokenUri,
        addLog,
        chains.getBuiltinChain(chainId)
      );
    } finally {
      isMinting.onOff();
    }
  }, [state, videoNft.web3, defaultContractAddress, account, addLog, chainId]);

  const onClickSwitchNetwork = (chainId: string) => () => {
    setLogs([]);
    return richSwitchChain(
      ethereum,
      chains.getBuiltinChain(chainId).spec,
      addLog
    );
  };

  const onClickConnect = useCallback(() => {
    setLogs([]);
    return connect();
  }, [setLogs, connect]);

  if (!initState.tokenUri) {
    useLoggedIn();
  }
  return (
    <Layout {...Content.metaData} css={{ minHeight: "100vh" }}>
      <Box css={{ position: "relative", flex: 1 }}>
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
            css={{
              alignItems: "center",
              justifyContent: "center",
              flexGrow: 1,
              flexDirection: "column",
            }}>
            <AlertDialog open={true}>
              <AlertDialogContent
                css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}
                onOpenAutoFocus={(e) => e.preventDefault()}>
                <AlertDialogTitle asChild>
                  <Heading size="1">Mint a Video NFT</Heading>
                </AlertDialogTitle>

                <Box
                  css={{ mt: "$3" }}
                  as="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    return onClickMint();
                  }}>
                  <Flex direction="column" gap="2">
                    {state?.tokenUri || !user ? undefined : (
                      <>
                        <Label htmlFor="file">File {state?.tokenUri}</Label>
                        <Flex direction="row" gap="2">
                          <Text>{state.file?.name}</Text>
                          <Button
                            css={{ display: "flex", ai: "center" }}
                            type="button"
                            size="2"
                            variant="primary"
                            onClick={async () => {
                              setStateProp(
                                "file",
                                await videoNft.uploader.pickFile()
                              );
                            }}>
                            Pick a file
                          </Button>
                        </Flex>
                      </>
                    )}

                    <Label htmlFor="contractAddress">
                      Contract Address (optional)
                    </Label>
                    <Tooltip content="Defaults to Livepeer-owned Video NFT contract.">
                      <TextField
                        size="2"
                        type="text"
                        id="contractAddress"
                        value={
                          state.contractAddress === defaultContractAddress
                            ? ""
                            : state.contractAddress
                        }
                        disabled={
                          isMinting.on ||
                          status !== "connected" ||
                          !chains.isChainBuiltin(chainId)
                        }
                        placeholder={
                          !defaultContractAddress
                            ? "Unsupported network"
                            : `Livepeer Video NFT (${defaultContractAddress})`
                        }
                        onChange={(e) =>
                          setStateProp("contractAddress", e.target.value)
                        }
                      />
                    </Tooltip>

                    <Label htmlFor="tokenUri">Token URI</Label>
                    <TextField
                      required={true}
                      autoFocus
                      size="2"
                      type="url"
                      pattern="^ipfs://.+"
                      id="tokenUri"
                      value={state.tokenUri}
                      disabled={true}
                      onChange={(e) => setStateProp("tokenUri", e.target.value)}
                      placeholder="ipfs://..."
                    />
                  </Flex>

                  <AlertDialogDescription asChild>
                    <Text
                      size="3"
                      variant="gray"
                      css={{ mt: "$2", fontSize: "$2", mb: "$4" }}>
                      <Box
                        css={{
                          overflow: "scroll",
                          p: "$4",
                          height: 200,
                          borderRadius: 6,
                        }}>
                        {(() => {
                          switch (status) {
                            case "initializing":
                              return (
                                <div>
                                  Synchronisation with MetaMask ongoing...
                                </div>
                              );
                            case "unavailable":
                              return (
                                <div>
                                  MetaMask not available. Install it at{" "}
                                  <a
                                    href="https://metamask.io/download"
                                    target="_blank">
                                    metamask.io
                                  </a>
                                </div>
                              );
                            case "notConnected":
                              return (
                                <div>Connect your MetaMask wallet below.</div>
                              );
                            case "connecting":
                              return <div>Connecting to MetaMask...</div>;
                            default:
                              return (
                                <div>Unknown MetaMask status: ${status}.</div>
                              );
                            case "connected":
                              if (!chains.isChainBuiltin(chainId)) {
                                return (
                                  <div>
                                    Only Polygon network is supported right now.
                                    Click below to switch or add it to MetaMask.
                                  </div>
                                );
                              }
                              return (
                                <>
                                  <Box css={{ mb: "$2" }}>
                                    Connected to {displayAddr(account)} on{" "}
                                    {
                                      chains.getBuiltinChain(chainId).spec
                                        .chainName
                                    }{" "}
                                    (<code>{parseInt(chainId, 16)}</code>)
                                  </Box>
                                  {logs.map((log, idx) => (
                                    <Box key={`log-${idx}`}>{log}</Box>
                                  ))}
                                </>
                              );
                          }
                        })()}
                      </Box>
                    </Text>
                  </AlertDialogDescription>

                  <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
                    {status === "notConnected" ? (
                      <Button
                        css={{ display: "flex", ai: "center" }}
                        type="button"
                        size="2"
                        disabled={status !== "notConnected"}
                        variant="primary"
                        onClick={onClickConnect}>
                        Connect to MetaMask
                      </Button>
                    ) : status === "connected" &&
                      !chains.isChainBuiltin(chainId) ? (
                      <>
                        <Button
                          css={{ display: "flex", ai: "center" }}
                          type="button"
                          size="2"
                          variant="primary"
                          onClick={onClickSwitchNetwork("0x13881")}>
                          Polygon Testnet
                        </Button>
                        <Button
                          css={{ display: "flex", ai: "center" }}
                          type="button"
                          size="2"
                          variant="primary"
                          onClick={onClickSwitchNetwork("0x89")}>
                          Polygon Mainnet
                        </Button>
                      </>
                    ) : user && jwt && state.file && !state.tokenUri ? (
                      <Button
                        css={{ display: "flex", ai: "center" }}
                        type="button"
                        size="2"
                        disabled={isUploading.on}
                        variant="primary"
                        onClick={async () => {
                          isUploading.onOn();
                          try {
                            const { file } = state;
                            addLog("Uploading file...");
                            let asset = await videoNft.api.createAsset(
                              file.name,
                              file
                            );
                            addLog("Normalizing for NFT...");
                            asset = await videoNft.api.nftNormalize(asset);
                            addLog("Exporting to IPFS...");
                            const { nftMetadataUrl } =
                              await videoNft.api.exportToIPFS(asset.id);
                            addLog("Done! NFT token URI: " + nftMetadataUrl);
                            setStateProp("tokenUri", nftMetadataUrl);
                          } catch (err) {
                            addLog("Error uploading file: " + err.message);
                          } finally {
                            isUploading.onOff();
                          }
                        }}>
                        {isUploading.on && (
                          <Spinner
                            css={{
                              color: "$hiContrast",
                              width: 16,
                              height: 16,
                              mr: "$2",
                            }}
                          />
                        )}
                        {isUploading.on ? "Uploading..." : "Upload file"}
                      </Button>
                    ) : (
                      <Button
                        css={{ display: "flex", ai: "center" }}
                        type="submit"
                        size="2"
                        disabled={isMinting.on || status !== "connected"}
                        variant="primary">
                        {isMinting.on && (
                          <Spinner
                            css={{
                              color: "$hiContrast",
                              width: 16,
                              height: 16,
                              mr: "$2",
                            }}
                          />
                        )}
                        {isMinting.on ? "Minting..." : "Mint NFT"}
                      </Button>
                    )}
                  </Flex>
                </Box>
              </AlertDialogContent>
            </AlertDialog>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
}
