const items = [
  {
    src: '/sport-tennis.png',
    className:
      'top-[240px] right-0 w-14 rotate-6 sm:top-[150px] sm:w-20 lg:right-3 lg:w-24 xl:right-10 xl:w-36',
    delay: '0s',
    duration: '6.2s',
  },
  {
    src: '/sport-volleyball.png',
    className:
      'top-[560px] left-0 w-14 -rotate-6 sm:top-[430px] sm:w-20 lg:left-1 lg:w-24 xl:left-8 xl:w-36',
    delay: '1.4s',
    duration: '7.4s',
  },
  {
    src: '/sport-football.png',
    className:
      'bottom-[190px] right-0 w-14 rotate-3 sm:w-20 lg:right-2 lg:w-24 xl:right-8 xl:w-32',
    delay: '0.8s',
    duration: '6.8s',
  },
  {
    src: '/sport-stretch.png',
    className:
      'bottom-[36px] left-0 w-16 -rotate-3 sm:w-24 lg:left-2 lg:w-28 xl:left-10 xl:w-40',
    delay: '2.1s',
    duration: '8s',
  },
]

export default function Scrapbook() {
  return (
    <>
      {items.map((item) => (
        <img
          key={item.src}
          src={item.src}
          alt=""
          aria-hidden="true"
          draggable="false"
          style={{ animationDelay: item.delay, animationDuration: item.duration }}
          className={`scrapbook-item absolute ${item.className}`}
        />
      ))}
    </>
  )
}
