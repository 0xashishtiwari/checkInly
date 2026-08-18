const Listing = require('../models/listing');

function normalizeListingPayload(listingPayload = {}) {
  const normalized = { ...listingPayload };

  if (typeof normalized.amenities === 'string') {
    normalized.amenities = normalized.amenities
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (normalized.instantBookable !== undefined) {
    normalized.instantBookable = normalized.instantBookable === true || normalized.instantBookable === 'true';
  }

  if (normalized.host?.isSuperhost !== undefined) {
    normalized.host.isSuperhost = normalized.host.isSuperhost === true || normalized.host.isSuperhost === 'true';
  }

  return normalized;
}

module.exports.index = async (req , res)=>{
  
  const {search , location , country , minPrice , maxPrice ,sort="newest" , page=1} = req.query;
  
  const filter = {};
  //key word search
  if(search?.trim()){
    filter.$text = {$search : search.trim()};
  }

  // location filter
  if(location?.trim()){
    filter.location = {
      $regex : location.trim(), $options : "i"
    }
  }

  //country filter 
  if(country?.trim()){
    filter.country = {
      $regex : country.trim(), $options : "i"
    }
  }


  //price filter 

  if(minPrice || maxPrice){
    filter.price = {};
    if(minPrice){
      filter.price.$gte = Number(minPrice);
    }
    if(maxPrice){
      filter.price.$lte = Number(maxPrice);
    }
  }

  // pagination
   const limit = 12
  
  const currentPage = Math.max(1 , Number(page));
  const skip = (currentPage - 1) * limit;

  // sorting  
  
  let sortOption = {createdAt : -1}; // default sorting by newest

  if(sort == 'price-low'){
    sortOption = {price : 1};
  }

  if(sort == 'price-high'){
    sortOption = {price : -1};
  }

  if(sort == 'oldest'){
    sortOption = {createdAt : 1};
  }

  const [allListings , total] =  await Promise.all([
    Listing.find(filter).sort(sortOption).skip(skip).limit(limit),
    Listing.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit);    

  
   
   res.render('listings/index.ejs' , {allListings,
      // Send filters back to EJS
        search,
        location,
        country,
        minPrice,
        maxPrice,
        sort,

        // Pagination
        currentPage,
        totalPages,
        total

   } );
  //  console.log(result);
}

module.exports.renderNewForm = (req ,res)=>{
    res.render('listings/new.ejs');
  
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id)
        .populate("owner")
        .populate("reviews");

    if (!listing) {
        req.flash(
            "error",
            "Listing you requested for does not exist"
        );

        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", {
        listing
    });
};


module.exports.createListing = async(req ,res ,next)=>{
   
    let url = req.file.path
    let filename = req.file.filename;
    // console.log(url , filename);

  const listingData = normalizeListingPayload(req.body.listing);
  const newListing = new Listing(listingData); 
   newListing.image = {url , filename};

   let ownedby = req.user.id;
   newListing.owner = ownedby;
   await newListing.save();
   req.flash('success' , "New Listing created!")
   res.redirect('/listings');
}


module.exports.renderEditForm = async(req , res)=>{

    let {id} = req.params;
    let listing = await Listing.findById(`${id}`);
    if(!listing){
    req.flash("error" , "Listing you requested for does not exist");
    res.redirect('/listings');
  }else{

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace('/upload' , '/upload/h_300,w_300')
 
    res.render('listings/edit.ejs' , {listing , originalImageUrl});
  }
}


module.exports.updateListing = async(req , res)=>{
      let {id} = req.params;
  let listingData = normalizeListingPayload({...req.body.listing});
      if(req.file){
        let url = req.file.path
       let filename = req.file.filename;
        listingData.image = {url , filename};
      }

    await Listing.findByIdAndUpdate(id , listingData);
     
      req.flash('success' ,'Listing Updated!')
      return res.redirect(`/listings/${id}`);
    
  
}

module.exports.deleteListing = async(req , res)=>{
   let {id} = req.params;
  let deletedListing =  await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash('success' ,'Listing Deleted!')
   res.redirect('/listings');
}