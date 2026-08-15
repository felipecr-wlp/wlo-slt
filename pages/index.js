export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/embed',
      permanent: false,
    },
  };
}

export default function Index() {
  return null;
}
