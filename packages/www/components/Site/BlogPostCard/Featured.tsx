import readingTime from "reading-time";
import { blocksToText } from "lib/utils";
import Link from "next/link";
import { Flex, Box, Text, Heading, Link as A } from "@livepeer/design-system";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "lib/client";
import Image from "next/image";
import TextTruncate from "react-text-truncate";
import { urlFor } from "lib/sanity";

export const FeaturedBlogPostCard = ({ post }: { post: any }) => {
  const text = blocksToText(post.content);
  const stats = readingTime(text);
  // const builder = imageUrlBuilder(client as any);

  return (
    <Link
      href="/blog/[slug]"
      as={`/blog/${post.slug.current}`}
      passHref
      legacyBehavior>
      <A
        css={{
          width: "100%",
          display: "inline-flex",
          alignItems: "flex-start",
          textDecoration: "none",
          marginRight: "auto",
          cursor: "pointer",
          borderRadius: 18,
          overflow: "hidden",
          height: 400,
          transition: "box-shadow .2s",
          bc: "$hiContrast",
          color: "$loContrast",
          "&:hover": {
            textDecoration: "none",
            boxShadow:
              "0px 2px 1px rgba(0, 0, 0, 0.04), 0px 16px 40px rgba(0, 0, 0, 0.04)",
          },
        }}>
        {post.mainImage && (
          <Box
            css={{
              position: "relative",
              width: "50%",
              height: 400,
              bc: "$hiContrast",
              img: {
                objectPosition: "left",
              },
            }}>
            <Image
              src={urlFor(post.mainImage).url()}
              alt={post.mainImage?.alt}
              fill
              style={{ objectFit: "cover" }}
            />
          </Box>
        )}
        <Flex
          css={{
            px: "$5",
            py: "$5",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            width: "50%",
          }}>
          <Box>
            <Text
              size="2"
              css={{
                textTransform: "uppercase",
                fontWeight: 600,
                color: "$loContrast",
              }}>
              {post.category.title}
            </Text>
            <Flex
              css={{
                alignItems: "center",
                pt: "$4",
                pb: "$5",
              }}>
              <Box
                css={{
                  position: "relative",
                  width: 30,
                  height: 30,
                  mr: "$2",
                }}>
                <Image
                  src={urlFor(post.author.image).url()}
                  alt={post.author.image?.alt}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </Box>
              <Box
                css={{
                  fontWeight: 600,
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}>
                {post.author.name}
              </Box>
              <Box
                css={{ mx: "$3", width: "1px", height: 16, bc: "$primary9" }}
              />
              <Box
                css={{
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}>
                {stats.text}
              </Box>
            </Flex>
            <Heading
              size="2"
              as="h2"
              css={{
                fontWeight: 500,
                pb: "$3",
                transition: "color .3s",
              }}>
              {post.title}
            </Heading>
            <Text
              as={Text}
              size="4"
              css={{
                color: "$loContrast",
                mb: "$3",
              }}>
              <TextTruncate
                line={5}
                element="span"
                truncateText="…"
                text={post.excerpt}
              />
            </Text>
          </Box>
          <A
            as={Box}
            css={{
              textDecoration: "none",
              fontWeight: 500,
              margin: 0,
              color: "$loContrast",
            }}>
            Read more
          </A>
        </Flex>
      </A>
    </Link>
  );
};
