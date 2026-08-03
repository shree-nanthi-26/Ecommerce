import { FiSearch } from "react-icons/fi";

function SearchBar() {
  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center bg-[#1D222C] border border-[#2D333D] rounded-xl px-4 py-3">

        <FiSearch
          className="text-gray-400"
          size={20}
        />

        <input
          type="text"
          placeholder="Search for laptops, mobiles, accessories..."
          className="ml-3 w-full bg-transparent outline-none text-white placeholder-gray-500"
        />

      </div>
    </div>
  );
}

export default SearchBar;