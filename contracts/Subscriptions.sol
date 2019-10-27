pragma solidity ^0.5.0;

import "./IERC20.sol";

contract Subscriptions {
    
    /// Describes subscription
    struct Subscription {
        /// subscription client
        address client;
        
        /// defines the token contract which payments are paid from.
        address token;
        
        /// the address of the provider
        address provider;
        
        /// the number of seconds per time unit
        uint256 time_unit;
        
        ///  the number of tokens that can be paid towards the subscription per time_unit;
        uint256 tokens_per_time_unit;
        
        /// the timestamp when the last payment was made
        uint256 last_payment_at;
        
        /// max subscription time
        uint256 max_subscription_time;
        
        /// when we started our subscription
        uint256 subscription_time;
        
        /// if the subscription has been cancelled
        bool canceled;
    }
    
    /// Event that a new subscription was created
    event SubsctiptionCreated(
        uint256 indexed _id,
        address indexed _client,
        address indexed _provider,
        address _token,
        uint256 _time_unit,
        uint256 _tokens_per_time_unit
    );
    
    /// Event that a new subscription was canceled
    event SubsctiptionCanceled(
        uint256 indexed _id,
        address indexed _client,
        address indexed _provider
    );
    
    /// Event that a subscription was payed
    event SubscriptionPayed(
        uint256 indexed _id,
        address indexed _client,
        address indexed _provider,
        address _token,
        uint256 _amount
    );
    
    /// All subscriptions in a system
    mapping(uint256 => Subscription) subscriptions;
    
    /// Subscriptions of concrete user
    mapping(address => uint256[]) clients;
    
    /// Subscriptions of concrete provider
    mapping(address => uint256[]) providers;
    
    /// Approval mapping for selling
    mapping(uint256 => address) approvals;
    
    /// List of subscriptions on sale
    uint256[] selling;
    
    /// Mapping of selling items index
    mapping(uint256 => uint256) selling_index;
    
    /// Mapping of selling item to price
    mapping(uint256 => uint256) selling_price;
    
    /// This part implements part of ERC721 Token standard for subscriptions
    /// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    function balanceOf(address _owner) public view returns (uint256) {
        return providers[_owner].length;
    }
    
    function ownerOf(uint256 _tokenId) public view returns (address) {
        return subscriptions[_tokenId].provider;
    }
    
    function transferFrom(
        address _from, 
        address _to, 
        uint256 _tokenId
    ) private {
        require(_to != _from);
        require(_to != address(0));
        
        address provider = subscriptions[_tokenId].provider;
        uint256 arrayLength = providers[provider].length;
        for (uint256 i=0; i<arrayLength; i++) {
            // TODO: Get rid of cycle dut to performance reasons
            if (providers[provider][i] == _tokenId) {
                providers[provider][i] = providers[provider][arrayLength - 1];
                delete providers[provider][arrayLength - 1];
                
                break;
            }  
        }

        subscriptions[_tokenId].provider = _to;
        providers[_to].push(_tokenId);
    }
    
    function approve(
            address _to, 
            uint256 _tokenId
        ) public {
        
        require(ownerOf(_tokenId) == msg.sender);
        approvals[_tokenId] = _to;
    }
    /// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    /// End of ERC721 Tiken standard
    

    function sellingIndex(uint256 _token_id) public view returns (uint256) {
        return selling_index[_token_id];
    }
    
    function sellingPrice(uint256 _token_id) public view returns (uint256) {
        return selling_price[_token_id];
    }
    
    function sellingCount() public view returns (uint256) {
        return selling.length;
    }
    
    function getSellingSubscription(
        uint256 _index
    ) public view returns 
    (
        uint256,
        address,
        address,
        address,
        uint256,
        uint256,
        uint256,
        bool,
        uint256,
        uint256,
        uint256
    ) {
        uint256 id = selling[selling_index[_index]];
        Subscription memory subscription = subscriptions[id];
        uint256 amount = 0;
        if (!subscription.canceled) {
            amount = getSubscriptionAmount(id);
        }
        return (
            id,
            subscription.client,
            subscription.token,
            subscription.provider,
            subscription.time_unit,
            subscription.tokens_per_time_unit,
            subscription.last_payment_at,
            subscription.canceled,
            amount,
            subscription.max_subscription_time,
            selling_price[id]
        );
    }

    function removeFromSale(uint256 _token_id) internal {
        uint256 index = selling_index[_token_id];
        selling[index] = selling[selling.length - 1];
        
        delete selling[selling.length - 1];
        delete selling_index[_token_id];
        delete selling_price[_token_id];
    }

    function withdraw(
        uint256 _token_id
    ) public {
        require(_token_id != 0);
        require(ownerOf(_token_id) == msg.sender);

        removeFromSale(_token_id);
    }
    
    function sell(uint256 _token_id, uint256 _price) public {
        require(_token_id != 0);
        require(_price != 0);
        require(subscriptions[_token_id].canceled != true);
        require(ownerOf(_token_id) == msg.sender);
        
        selling_price[_token_id] = _price;
        selling_index[_token_id] = selling.length;
        selling.push(_token_id);
    }
    
    function buy(uint256 _token_id) public {
        require(_token_id != 0);
        require(ownerOf(_token_id) != msg.sender);

        executeSubscription(_token_id);

        IERC20 token = IERC20(subscriptions[_token_id].token);
        token.transferFrom(
            msg.sender,
            address(this),
            selling_price[_token_id]
        );
        
        token.transfer(subscriptions[_token_id].provider, selling_price[_token_id]);
        
        transferFrom(
            subscriptions[_token_id].provider,
            msg.sender,
            _token_id
        );

        removeFromSale(_token_id);
    }
    
    /// Creates new subscription
    function createSubscription(
        address _token, 
        address _provider,
        uint256 _time_uint,
        uint256 _tokens_per_time_unit,
        uint256 _max_subscription_time
    ) public returns (uint256) {
        
        // Checks on input data basic validity. Note, that 
        // there can be on-chain subscription terms registry
        //
        require(_token != address(0));
        require(_provider != address(0));
        require(_time_uint > 0);
        require(_tokens_per_time_unit > 0);
        require(_max_subscription_time > 0);
        
        uint256 amount = _tokens_per_time_unit * _max_subscription_time;
        
        // Accept payment right away
        //
        IERC20 token = IERC20(_token);
        token.transferFrom(
            msg.sender,
            address(this),
            amount
        );
        
        uint256 id = uint256(keccak256(abi.encodePacked(
            msg.sender,
            _token,
            _provider,
            _time_uint,
            _tokens_per_time_unit,
            now
        )));
        
        Subscription memory subscription = Subscription(
            msg.sender,
            _token,
            _provider,
            _time_uint,
            _tokens_per_time_unit,
            now,
            _max_subscription_time,
            now,
            false
        );
        
        subscriptions[id] = subscription;
        clients[msg.sender].push(id);
        providers[_provider].push(id);
        
        emit SubsctiptionCreated(
            id,
            msg.sender,
            _provider,
            _token,
            _time_uint,
            _tokens_per_time_unit
        );
        
        return id;
    }
    
    /// Cancels subscription
    function cancelSubscription(
        uint256 _id
    ) public returns (bool) {
        
        require(subscriptions[_id].client == msg.sender);
        require(subscriptions[_id].canceled == false);
        
        subscriptions[_id].canceled = true;
        
        emit SubsctiptionCanceled(
            _id,
            msg.sender,
            subscriptions[_id].provider
        );
        
        return true;
    }
    
    /// Executes subscriptions
    function executeSubscription(
        uint256 _id
    ) public returns (bool) {
            
        require(subscriptions[_id].canceled == false);
        
        uint256 amount = getSubscriptionAmount(_id);
        
        subscriptions[_id].last_payment_at = now;
        
        IERC20 token = IERC20(subscriptions[_id].token);
        token.transfer(subscriptions[_id].provider, amount);
        
        emit SubscriptionPayed(
            _id,
            subscriptions[_id].client,
            subscriptions[_id].provider,
            subscriptions[_id].token,
            amount
        );
        
        return true;
    }
    
    /// Computes how much provider can withdraw with conrete subscription
    function getSubscriptionAmount(
        uint256 _id
    ) public view returns (uint256) {
        
        return getSubscriptionAmountForDate(_id, now);
    }
    
        /// Computes how much provider can withdraw with conrete subscription
    function getSubscriptionAmountForDate(
        uint256 _id,
        uint256 _date
    ) public view returns (uint256) {
        
        require(_date > subscriptions[_id].last_payment_at);
        require(subscriptions[_id].canceled == false);
        
        uint256 time_unit = subscriptions[_id].time_unit;
        uint256 tokens_per_time_unit = subscriptions[_id].tokens_per_time_unit;
        uint256 last_payment_at = subscriptions[_id].last_payment_at;
        uint256 max_subscription_time = subscriptions[_id].max_subscription_time;
        uint256 subscription_time = subscriptions[_id].subscription_time;
        
        uint256 max_date = subscription_time + max_subscription_time * time_unit;
        uint256 effective_date = _date;
        if (effective_date > max_date) {
            effective_date = max_date;
        }
        uint256 periods =  (effective_date - last_payment_at) / time_unit;
        
        return periods * tokens_per_time_unit;
    }
    
    function getClientSubscriptionCount(
        address _client
    ) public view returns (uint256) {
        return clients[_client].length;
    }
    
    function getClientSubscription(
        address _client,
        uint256 _index
    ) public view returns 
    (
        uint256,
        address,
        address,
        address,
        uint256,
        uint256,
        uint256,
        bool,
        uint256,
        uint256
    ) {
        uint256 id = clients[_client][_index];
        Subscription memory subscription = subscriptions[id];
        uint256 amount = 0;
        if (!subscription.canceled) {
            amount = getSubscriptionAmount(id);
        }
        return (
            id,
            subscription.client,
            subscription.token,
            subscription.provider,
            subscription.time_unit,
            subscription.tokens_per_time_unit,
            subscription.last_payment_at,
            subscription.canceled,
            amount,
            subscription.max_subscription_time
        );
    }
    
    function getProviderSubscriptionCount(
        address _provider
    ) public view returns (uint256) {
        return providers[_provider].length;
    }
    
    function getProviderSubscription(
        address _provider,
        uint256 _index
    ) public view returns 
    (
        uint256,
        address,
        address,
        address,
        uint256,
        uint256,
        uint256,
        bool,
        uint256,
        uint256
    ) {
        uint256 id = providers[_provider][_index];
        Subscription memory subscription = subscriptions[id];
        uint256 amount = 0;
        if (!subscription.canceled) {
            amount = getSubscriptionAmount(id);
        }
        return (
            id,
            subscription.client,
            subscription.token,
            subscription.provider,
            subscription.time_unit,
            subscription.tokens_per_time_unit,
            subscription.last_payment_at,
            subscription.canceled,
            amount,
            subscription.max_subscription_time
        );
    }
}
