import { format } from "date-fns";

export default {
  name: "post",
  type: "document",
  title: "Blog Post",
  fieldsets: [
    {
      title: "SEO & metadata",
      name: "metadata",
    },
  ],
  fields: [
    {
      name: "title",
      type: "string",
      title: "Title",
    },
    {
      name: "slug",
      type: "slug",
      title: "Slug",
      options: {
        source: "title",
        maxLength: 96,
      },
    },
    {
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
    },
    {
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
    },
    {
      name: "mainImage",
      type: "imageExtended",
      title: "Main image",
    },
    {
      name: "featured",
      type: "boolean",
      title: "Featured",
    },
    {
      name: "excerpt",
      type: "text",
      title: "Excerpt",
      description:
        "This ends up on summary pages, on Google, when people share your post in social media.",
    },
    {
      name: "body",
      type: "markdown",
      title: "Body",
      hidden: true, // deprecated markdown field
    },
    {
      name: "content",
      type: "array",
      title: "Content",
      of: [
        {
          type: "block",
        },
        {
          type: "image",
        },
        {
          type: "code",
        },
        {
          title: "Video",
          type: "mux.video",
        },
      ],
    },
    {
      name: "metaTitle",
      type: "string",
      title: "Title",
      description: "This title populates meta-tags on the webpage",
      fieldset: "metadata",
    },
    {
      name: "metaDescription",
      type: "text",
      title: "Description",
      description: "This description populates meta-tags on the webpage",
      fieldset: "metadata",
    },
    {
      name: "metaUrl",
      type: "url",
      title: "URL",
      description: "This url populates meta-tags on the webpage",
      fieldset: "metadata",
    },
    {
      name: "openGraphImage",
      type: "image",
      title: "Open Graph Image",
      description: "Image for sharing previews on Facebook, Twitter etc.",
      fieldset: "metadata",
    },
  ],

  preview: {
    select: {
      title: "title",
      slug: "slug",
      media: "mainImage",
    },
    prepare({ title = "No title", slug = {}, media }) {
      return {
        title,
        media,
      };
    },
  },
};
