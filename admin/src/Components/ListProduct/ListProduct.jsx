import React, { useEffect, useState } from 'react'
import './ListProduct.css'
import cross_icon from '../../assets/cross_icon.png'


const ListProduct = () => {

    const [allproducts,setAllProducts] = useState([]); // Initializing with empty array

    //Fetch the data from API to allproducts
    const fetchInfo = async ()=>{
        await fetch('http://localhost:4000/allproducts')  //
        .then((res)=>res.json())  //Parse the response, after getting the response we will parse this response and for that we will use response.json method
        .then((data)=>{setAllProducts(data)}); //We will get another promise and we will parse that promise we will be passing that data to setAllProducts function
    }

    // To run the function fetchInfo whenever the componenet is wanted for use the use effect
    useEffect(()=>{
        fetchInfo();
    },[])

    //Async arrow Function to remove product
    const remove_product = async (id)=>{
        await fetch('http://localhost:4000/removeproduct',{
            method:'POST',
            headers:{
                Accept:'application/json',
                'Content-Type':'application/json',
            },
            body:JSON.stringify({id:id})
        })
        await fetchInfo();
    }

    return (
        <div className="list-product">
            <h1>All Products List</h1>
            <div className="listproduct-format-main">
                <p>Product</p>
                <p>Title</p>
                <p>Old price</p>
                <p>New price</p>
                <p>Category</p>
                <p>Remove</p>
            </div>
            <div className="listproduct-allproducts">
                <hr />
                {allproducts.map((product,index)=>{ //Wrapping div and hr tag in that empty tag
                    return <> 
                    <div key={index} className="listproduct-format-main listproduct-format">
                        <img src={product.image} alt="" className="listproduct-product-icon" />
                        <p>{product.name}</p>
                        <p>${product.old_price}</p>
                        <p>${product.new_price}</p>
                        <p>{product.category}</p>
                        <img onClick={()=>{remove_product(product.id)}} src={cross_icon} alt="" className="listproduct-remove-icon" />
                    </div>
                    <hr />
                    </>
                })}
            </div>
        </div>
    )
}

export default ListProduct