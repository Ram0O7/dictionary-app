import React from 'react';
import { FaBook } from 'react-icons/fa';
// import { FaMoon } from 'react-icons/fa';
import { FaSun } from 'react-icons/fa';
import './Navbar.scss';

const Navbar = () => {
  return (
    <nav className='navbar'>
      <FaBook className='book-icon' />
      <div className="style-togglers">
        <select name="font" id="font-select">
          <option value="serif">serif</option>
          <option value="sans-serif">sans-serif</option>
          <option value="monospace">monospace</option>
        </select>
        <div className="switch"><div className='toggle-btn'></div></div>
        <FaSun/>
      </div>
    </nav>
  )
}

export default Navbar;
