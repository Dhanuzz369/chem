/** How an order runs, shared by the home page and llms-full.txt so the two never drift apart. */
export const orderingSteps: { title: string; body: string }[] = [
  {
    title: "Enquiry",
    body: "Send the quote form with the product, quantity, packaging, destination and delivery terms. Grade or specification details help.",
  },
  {
    title: "Quote",
    body: "We reply with a quote for your order. Price, packaging, terms and timing are set out there and depend on the order.",
  },
  {
    title: "Documentation",
    body: "An SDS is available on request for every product. Other documents you need, such as a COA, are agreed in the quote.",
  },
  {
    title: "Dispatch",
    body: "Once the order is confirmed, the goods are packed as agreed and shipped with the documents for your destination.",
  },
];
