import React from "react";

const LinkRender = ({ children }) => <span>{children} 🌍</span>;

export default {
  title: "URL",
  name: "link",
  type: "object",
  fields: [
    {
      title: "URL",
      name: "href",
      type: "url",
      validation: (Rule) =>
        Rule.uri({
          allowRelative: true,
          scheme: ["https", "http", "mailto", "tel"],
        }),
    },
    { title: "External", name: "isExternal", type: "boolean" },
    {
      title: "Title",
      name: "title",
      type: "string",
    },
  ],
  blockEditor: {
    icon: () => "🌍",
    render: LinkRender,
  },
};
