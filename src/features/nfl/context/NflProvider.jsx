import NflContext from "./NflContext";
import { useNfl } from "../hooks/useNfl";

export default function NflProvider({ children }) {
  const NflMethods = useNfl();

  return (
    <NflContext.Provider value={NflMethods}>{children}</NflContext.Provider>
  );
}
