const Tree = ({ src }: { src: string }) => {
  return (
    <div className="relative h-[450px] w-[400px]">
      <div
        className="bg-tree absolute inset-0 transition-opacity duration-500"
        style={{
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
        }}
      />
    </div>
  )
}

export default Tree
