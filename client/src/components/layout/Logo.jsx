function Logo() {
  return (
    <div className="flex items-center gap-3 cursor-pointer">
      <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
        <span className="text-black text-2xl font-bold">E</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">
          ElectroMart
        </h1>

        <p className="text-xs text-green-400">
          Future Electronics
        </p>
      </div>
    </div>
  );
}

export default Logo;