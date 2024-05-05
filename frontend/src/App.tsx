import './App.css';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { BrowserRouter, Route, Routes} from 'react-router-dom';
import Classifieds from './pages/Classifieds';

const apolloClient = new ApolloClient({
  uri: 'http://localhost:4000/',
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Classifieds></Classifieds>}></Route>
        </Routes>
      </BrowserRouter>
    </ApolloProvider>
  );
}

export default App;