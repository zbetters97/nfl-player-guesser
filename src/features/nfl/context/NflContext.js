import { createContext, useContext } from "react";

const NflContext = createContext();

export function useNflContext() {
  const context = useContext(NflContext);

  if (context === undefined) {
    throw new Error(
      "Error! useNflContext must be used within NflProvidor.",
    );
  }

  return context;
}

export default NflContext;
